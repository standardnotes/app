import {
  AsymmetricMessagePayloadType,
  TrustedContactInterface,
  TrustedContactMutator,
  AsymmetricMessageSenderKeysetRevoked,
  PortablePublicKeySet,
} from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { ContactServiceInterface } from '../ContactServiceInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { EncryptAsymmetricMessagePayload } from '../../Encryption/UseCase/Asymmetric/EncryptAsymmetricMessagePayload'
import { SendAsymmetricMessageUseCase } from '../../AsymmetricMessage/UseCase/SendAsymmetricMessageUseCase'
import { GetOutboundAsymmetricMessages } from '../../AsymmetricMessage/UseCase/GetOutboundAsymmetricMessages'
import { GetAsymmetricStringAdditionalData } from '../../Encryption/UseCase/Asymmetric/GetAsymmetricStringAdditionalData'
import { isClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface, SharedVaultInvitesServerInterface } from '@standardnotes/api'

export class RevokePublicKeyUseCase implements UseCaseInterface<void> {
  constructor(
    private mutator: MutatorClientInterface,
    private contacts: ContactServiceInterface,
    private messageServer: AsymmetricMessageServerInterface,
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private encryptAsymmetricMessageUseCase: EncryptAsymmetricMessagePayload,
    private sendMessageUseCase: SendAsymmetricMessageUseCase,
    private getOutboundMessages: GetOutboundAsymmetricMessages,
    private getAsymmetricStringAdditionalData: GetAsymmetricStringAdditionalData,
  ) {}

  async execute(dto: {
    selfContact: TrustedContactInterface
    revokeKeySet: PortablePublicKeySet
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<Result<void>> {
    const currentKeySet = dto.selfContact.publicKeySet

    if (
      currentKeySet.encryption === dto.revokeKeySet.encryption ||
      currentKeySet.signing === dto.revokeKeySet.signing
    ) {
      return Result.fail('Cannot revoke current key set')
    }

    await this.mutator.changeItem<TrustedContactMutator>(dto.selfContact, (mutator) => {
      mutator.revokePublicKeySet({
        encryption: dto.revokeKeySet.encryption,
        signing: dto.revokeKeySet.signing,
      })
    })

    await Promise.all([
      this.sendMessageToContacts(dto),
      this.revokeOutboundMessages(dto.revokeKeySet),
      this.revokeOutboundInvites(dto.revokeKeySet),
    ])

    return Result.ok()
  }

  private async revokeOutboundInvites(revokeKeySet: PortablePublicKeySet): Promise<void> {
    const invites = await this.vaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(invites)) {
      return
    }

    const invitesToDelete = []

    for (const invite of invites.data.invites) {
      const additionalDataResult = this.getAsymmetricStringAdditionalData.execute({
        message: invite.encrypted_message,
      })

      if (additionalDataResult.isFailed()) {
        continue
      }

      const additionalData = additionalDataResult.getValue()

      if (
        additionalData.senderPublicKey === revokeKeySet.encryption ||
        additionalData.signingData.publicKey === revokeKeySet.signing
      ) {
        invitesToDelete.push(invite)
      }
    }

    await Promise.all(
      invitesToDelete.map((invite) =>
        this.vaultInvitesServer.deleteInvite({
          inviteUuid: invite.uuid,
          sharedVaultUuid: invite.shared_vault_uuid,
        }),
      ),
    )
  }

  private async revokeOutboundMessages(revokeKeySet: PortablePublicKeySet): Promise<void> {
    const messages = await this.getOutboundMessages.execute()

    if (isClientDisplayableError(messages)) {
      return
    }

    const messagesToDelete = []

    for (const message of messages) {
      const additionalDataResult = this.getAsymmetricStringAdditionalData.execute({
        message: message.encrypted_message,
      })

      if (additionalDataResult.isFailed()) {
        continue
      }

      const additionalData = additionalDataResult.getValue()

      if (
        additionalData.senderPublicKey === revokeKeySet.encryption ||
        additionalData.signingData.publicKey === revokeKeySet.signing
      ) {
        messagesToDelete.push(message)
      }
    }

    await Promise.all(
      messagesToDelete.map((message) => this.messageServer.deleteMessage({ messageUuid: message.uuid })),
    )
  }

  private async sendMessageToContacts(dto: {
    revokeKeySet: PortablePublicKeySet
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<void> {
    const allContacts = this.contacts.getAllContacts().filter((contact) => !contact.isMe)

    for (const contact of allContacts) {
      const message: AsymmetricMessageSenderKeysetRevoked = {
        type: AsymmetricMessagePayloadType.SenderKeysetRevoked,
        data: {
          recipientUuid: contact.contactUuid,
          revokedPublicKey: dto.revokeKeySet.encryption,
          revokedSigningPublicKey: dto.revokeKeySet.signing,
        },
      }

      const encryptedMessage = this.encryptAsymmetricMessageUseCase.execute({
        message: message,
        senderKeyPair: dto.senderEncryptionKeyPair,
        senderSigningKeyPair: dto.senderSigningKeyPair,
        recipientPublicKey: contact.publicKeySet.encryption,
      })

      if (encryptedMessage.isFailed()) {
        continue
      }

      await this.sendMessageUseCase.execute({
        recipientUuid: contact.contactUuid,
        encryptedMessage: encryptedMessage.getValue(),
        replaceabilityIdentifier: undefined,
      })
    }
  }
}
