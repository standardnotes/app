import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { ReuploadAllInvites } from '../../VaultInvite/UseCase/ReuploadAllInvites'
import { ResendAllMessages } from '../../AsymmetricMessage/UseCase/ResendAllMessages'
import { SelfContactManager } from '../SelfContactManager'
import { GetAllContacts } from './GetAllContacts'
import { SendOwnContactChangeMessage } from './SendOwnContactChangeMessage'
import { AsymmetricMessageServer, SharedVaultInvitesServer } from '@standardnotes/api'

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
  ) {}

  async execute(dto: Dto): Promise<Result<void>> {
    await this.selfContactManager.updateWithNewPublicKeySet({
      encryption: dto.newKeys.encryption.publicKey,
      signing: dto.newKeys.signing.publicKey,
    })

    await Promise.all([
      this._reuploadAllInvites.execute({
        keys: dto.newKeys,
        previousKeys: dto.previousKeys,
      }),

      this._resendAllMessages.execute({
        keys: dto.newKeys,
        previousKeys: dto.previousKeys,
      }),
    ])

    await this.sendOwnContactChangeEventToAllContacts(dto)

    void this.messageServer.deleteAllInboundMessages()
    void this.invitesServer.deleteAllInboundInvites()

    return Result.ok()
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
