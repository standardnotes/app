import { DecryptOwnMessage } from './../../Encryption/UseCase/Asymmetric/DecryptOwnMessage'
import { AsymmetricMessageServerHash, isErrorResponse } from '@standardnotes/responses'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'
import { ResendMessage } from './ResendMessage'
import { FindContact } from '../../Contacts/UseCase/FindContact'
import { AsymmetricMessagePayload, AsymmetricMessagePayloadType } from '@standardnotes/models'

export class ResendAllMessages implements UseCaseInterface<void> {
  constructor(
    private resendMessage: ResendMessage,
    private decryptOwnMessage: DecryptOwnMessage<AsymmetricMessagePayload>,
    private messageServer: AsymmetricMessageServerInterface,
    private findContact: FindContact,
  ) {}

  messagesToExcludeFromResending(): AsymmetricMessagePayloadType[] {
    /**
     * Sender key pair changed messages should never be re-encrypted with new keys as they must use the
     * previous keys used by the sender before their keypair changed.
     */
    return [AsymmetricMessagePayloadType.SenderKeypairChanged]
  }

  async execute(params: {
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    previousKeys?: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
  }): Promise<Result<AsymmetricMessageServerHash[]>> {
    const messages = await this.messageServer.getOutboundUserMessages()

    if (isErrorResponse(messages)) {
      return Result.fail('Failed to get outbound user messages')
    }

    const errors: string[] = []

    for (const message of messages.data.messages) {
      const recipient = this.findContact.execute({ userUuid: message.recipient_uuid })
      if (recipient.isFailed()) {
        errors.push(`Contact not found for invite ${message.recipient_uuid}`)
        continue
      }

      const decryptionResult = this.decryptOwnMessage.execute({
        message: message.encrypted_message,
        privateKey: params.previousKeys?.encryption.privateKey ?? params.keys.encryption.privateKey,
        recipientPublicKey: recipient.getValue().publicKeySet.encryption,
      })

      if (decryptionResult.isFailed()) {
        errors.push(`Failed to decrypt message ${message.uuid}`)
        continue
      }

      const decryptedMessage = decryptionResult.getValue()
      if (this.messagesToExcludeFromResending().includes(decryptedMessage.type)) {
        continue
      }

      await this.resendMessage.execute({
        keys: params.keys,
        previousKeys: params.previousKeys,
        decryptedMessage: decryptedMessage,
        rawMessage: message,
        recipient: recipient.getValue(),
      })

      await this.messageServer.deleteMessage({
        messageUuid: message.uuid,
      })
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(', '))
    }

    return Result.ok()
  }
}
