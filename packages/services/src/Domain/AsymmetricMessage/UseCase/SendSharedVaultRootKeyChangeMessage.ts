import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash, ClientDisplayableError } from '@standardnotes/responses'
import {
  TrustedContactInterface,
  AsymmetricMessagePayloadType,
  KeySystemIdentifier,
  AsymmetricMessageSharedVaultRootKeyChanged,
} from '@standardnotes/models'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendAsymmetricMessageUseCase } from './SendAsymmetricMessageUseCase'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class SendSharedVaultRootKeyChangeMessage {
  constructor(
    private encryption: EncryptionProviderInterface,
    private items: ItemManagerInterface,
    private messageServer: AsymmetricMessageServerInterface,
  ) {}

  async execute(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    contact: TrustedContactInterface
  }): Promise<AsymmetricMessageServerHash | ClientDisplayableError> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.keySystemIdentifier)
    if (!keySystemRootKey) {
      throw new Error(`Vault key not found for keySystemIdentifier ${params.keySystemIdentifier}`)
    }

    const message: AsymmetricMessageSharedVaultRootKeyChanged = {
      type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
      data: keySystemRootKey.content,
    }

    const encryptedMessage = this.encryption.asymmetricallyEncryptMessage({
      message: message,
      senderPrivateKey: params.senderKeyPair.privateKey,
      senderSigningKeyPair: params.senderSigningKeyPair,
      recipientPublicKey: params.contact.publicKey.encryption,
    })

    const sendMessageUseCase = new SendAsymmetricMessageUseCase(this.messageServer)
    const sendMessageResult = await sendMessageUseCase.execute({
      recipientUuid: params.contact.contactUuid,
      senderPublicKey: params.senderKeyPair.publicKey,
      encryptedMessage,
    })

    return sendMessageResult
  }
}
