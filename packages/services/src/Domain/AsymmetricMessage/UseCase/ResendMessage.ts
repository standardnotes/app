import { AsymmetricMessagePayload, TrustedContactInterface } from '@standardnotes/models'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { SendMessage } from './SendMessage'

export class ResendMessage implements UseCaseInterface<void> {
  constructor(
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
    rawMessage: AsymmetricMessageServerHash
    decryptedMessage: AsymmetricMessagePayload
  }): Promise<Result<AsymmetricMessageServerHash>> {
    const encryptedMessage = this.encryptMessage.execute({
      message: params.decryptedMessage,
      keys: params.keys,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    if (encryptedMessage.isFailed()) {
      return Result.fail(encryptedMessage.getError())
    }

    const sendMessageResult = await this.sendMessage.execute({
      recipientUuid: params.recipient.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      replaceabilityIdentifier: params.rawMessage.replaceability_identifier || undefined,
    })

    return sendMessageResult
  }
}
