import { DecryptOwnMessage } from '../../Encryption/UseCase/Asymmetric/DecryptOwnMessage'
import { AsymmetricMessagePayload, TrustedContactInterface } from '@standardnotes/models'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { SendMessage } from './SendMessage'

export class ResendMessage implements UseCaseInterface<void> {
  constructor(
    private decryptOwnMessage: DecryptOwnMessage<AsymmetricMessagePayload>,
    private sendMessage: SendMessage,
    private encryptMessage: EncryptMessage,
  ) {}

  async execute(params: {
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    previousKeys?: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    recipient: TrustedContactInterface
    message: AsymmetricMessageServerHash
  }): Promise<Result<AsymmetricMessageServerHash>> {
    const decryptionResult = this.decryptOwnMessage.execute({
      message: params.message.encrypted_message,
      privateKey: params.previousKeys?.encryption.privateKey ?? params.keys.encryption.privateKey,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    if (decryptionResult.isFailed()) {
      return Result.fail(decryptionResult.getError())
    }

    const decryptedMessage = decryptionResult.getValue()

    const encryptedMessage = this.encryptMessage.execute({
      message: decryptedMessage,
      keys: params.keys,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    if (encryptedMessage.isFailed()) {
      return Result.fail(encryptedMessage.getError())
    }

    const sendMessageResult = await this.sendMessage.execute({
      recipientUuid: params.recipient.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      replaceabilityIdentifier: params.message.replaceabilityIdentifier,
    })

    return sendMessageResult
  }
}
