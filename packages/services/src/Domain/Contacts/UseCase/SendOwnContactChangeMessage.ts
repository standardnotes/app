import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import {
  TrustedContactInterface,
  AsymmetricMessagePayloadType,
  AsymmetricMessageSenderKeypairChanged,
} from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendMessage } from '../../AsymmetricMessage/UseCase/SendMessage'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class SendOwnContactChangeMessage implements UseCaseInterface<AsymmetricMessageServerHash> {
  constructor(
    private encryptMessage: EncryptMessage,
    private sendMessage: SendMessage,
  ) {}

  async execute(params: {
    senderOldKeyPair: PkcKeyPair
    senderOldSigningKeyPair: PkcKeyPair
    senderNewKeyPair: PkcKeyPair
    senderNewSigningKeyPair: PkcKeyPair
    contact: TrustedContactInterface
  }): Promise<Result<AsymmetricMessageServerHash>> {
    const message: AsymmetricMessageSenderKeypairChanged = {
      type: AsymmetricMessagePayloadType.SenderKeypairChanged,
      data: {
        recipientUuid: params.contact.contactUuid,
        newEncryptionPublicKey: params.senderNewKeyPair.publicKey,
        newSigningPublicKey: params.senderNewSigningKeyPair.publicKey,
      },
    }

    const encryptedMessage = this.encryptMessage.execute({
      message: message,
      keys: {
        encryption: params.senderOldKeyPair,
        signing: params.senderOldSigningKeyPair,
      },
      recipientPublicKey: params.contact.publicKeySet.encryption,
    })

    if (encryptedMessage.isFailed()) {
      return Result.fail(encryptedMessage.getError())
    }

    const sendMessageResult = await this.sendMessage.execute({
      recipientUuid: params.contact.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      replaceabilityIdentifier: undefined,
    })

    return sendMessageResult
  }
}
