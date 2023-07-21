import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash, ClientDisplayableError } from '@standardnotes/responses'
import {
  TrustedContactInterface,
  AsymmetricMessagePayloadType,
  AsymmetricMessageSenderKeypairChanged,
} from '@standardnotes/models'
import { AsymmetricMessageServer } from '@standardnotes/api'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendMessage } from './SendMessage'

export class SendOwnContactChangeMessage {
  constructor(private encryption: EncryptionProviderInterface, private messageServer: AsymmetricMessageServer) {}

  async execute(params: {
    senderOldKeyPair: PkcKeyPair
    senderOldSigningKeyPair: PkcKeyPair
    senderNewKeyPair: PkcKeyPair
    senderNewSigningKeyPair: PkcKeyPair
    contact: TrustedContactInterface
  }): Promise<AsymmetricMessageServerHash | ClientDisplayableError> {
    const message: AsymmetricMessageSenderKeypairChanged = {
      type: AsymmetricMessagePayloadType.SenderKeypairChanged,
      data: {
        recipientUuid: params.contact.contactUuid,
        newEncryptionPublicKey: params.senderNewKeyPair.publicKey,
        newSigningPublicKey: params.senderNewSigningKeyPair.publicKey,
      },
    }

    const encryptedMessage = this.encryption.asymmetricallyEncryptMessage({
      message: message,
      senderKeyPair: params.senderOldKeyPair,
      senderSigningKeyPair: params.senderOldSigningKeyPair,
      recipientPublicKey: params.contact.publicKeySet.encryption,
    })

    const sendMessageUseCase = new SendMessage(this.messageServer)
    const sendMessageResult = await sendMessageUseCase.execute({
      recipientUuid: params.contact.contactUuid,
      encryptedMessage,
      replaceabilityIdentifier: undefined,
    })

    return sendMessageResult
  }
}
