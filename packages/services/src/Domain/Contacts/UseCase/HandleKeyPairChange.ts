import { InternalFeatureService } from './../../InternalFeatures/InternalFeatureService'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { ReuploadAllInvites } from '../../VaultInvite/UseCase/ReuploadAllInvites'
import { ResendAllMessages } from '../../AsymmetricMessage/UseCase/ResendAllMessages'
import { SelfContactManager } from '../SelfContactManager'
import { GetAllContacts } from './GetAllContacts'
import { SendOwnContactChangeMessage } from './SendOwnContactChangeMessage'
import { AsymmetricMessageServer, SharedVaultInvitesServer } from '@standardnotes/api'
import { PortablePublicKeySet } from '@standardnotes/models'
import { InternalFeature } from '../../InternalFeatures/InternalFeature'
import { CreateOrEditContact } from './CreateOrEditContact'
import { isErrorResponse } from '@standardnotes/responses'
import { LoggerInterface } from '@standardnotes/utils'

type Dto = {
  newKeys: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
  previousKeys?: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
}

export class HandleKeyPairChange implements UseCaseInterface<void> {
  constructor(
    private selfContactManager: SelfContactManager,
    private invitesServer: SharedVaultInvitesServer,
    private messageServer: AsymmetricMessageServer,
    private _reuploadAllInvites: ReuploadAllInvites,
    private _resendAllMessages: ResendAllMessages,
    private _getAllContacts: GetAllContacts,
    private _sendOwnContactChangedMessage: SendOwnContactChangeMessage,
    private _createOrEditContact: CreateOrEditContact,
    private logger: LoggerInterface,
  ) {}

  async execute(dto: Dto): Promise<Result<void>> {
    await this.updateSelfContact({
      encryption: dto.newKeys.encryption.publicKey,
      signing: dto.newKeys.signing.publicKey,
    })

    const results = await Promise.all([
      this._reuploadAllInvites.execute({
        keys: dto.newKeys,
        previousKeys: dto.previousKeys,
      }),

      this._resendAllMessages.execute({
        keys: dto.newKeys,
        previousKeys: dto.previousKeys,
      }),
    ])

    for (const result of results) {
      if (result.isFailed()) {
        this.logger.error(result.getError())
      }
    }

    await this.sendOwnContactChangeEventToAllContacts(dto)

    const deleteResponses = await Promise.all([
      this.messageServer.deleteAllInboundMessages(),
      this.invitesServer.deleteAllInboundInvites(),
    ])

    for (const response of deleteResponses) {
      if (isErrorResponse(response)) {
        this.logger.error(JSON.stringify(response))
      }
    }

    return Result.ok()
  }

  private async updateSelfContact(publicKeySet: PortablePublicKeySet) {
    if (!InternalFeatureService.get().isFeatureEnabled(InternalFeature.Vaults)) {
      return
    }

    const selfContact = this.selfContactManager.selfContact
    if (!selfContact) {
      return
    }

    await this._createOrEditContact.execute({
      contactUuid: selfContact.contactUuid,
      publicKey: publicKeySet.encryption,
      signingPublicKey: publicKeySet.signing,
    })
  }

  private async sendOwnContactChangeEventToAllContacts(data: Dto): Promise<void> {
    if (!data.previousKeys) {
      return
    }

    const contacts = this._getAllContacts.execute()
    if (contacts.isFailed()) {
      return
    }

    for (const contact of contacts.getValue()) {
      if (contact.isMe) {
        continue
      }

      await this._sendOwnContactChangedMessage.execute({
        senderOldKeyPair: data.previousKeys.encryption,
        senderOldSigningKeyPair: data.previousKeys.signing,
        senderNewKeyPair: data.newKeys.encryption,
        senderNewSigningKeyPair: data.newKeys.signing,
        contact,
      })
    }
  }
}
