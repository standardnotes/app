import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'

export class GetAsymmetricMessageTrustedPayload<M extends AsymmetricMessagePayload> {
  constructor(private encryption: EncryptionProviderInterface, private contacts: ContactServiceInterface) {}

  execute(dto: { privateKey: string; message: AsymmetricMessageServerHash }): M | undefined {
    const trustedContact = this.contacts.findTrustedContact(dto.message.sender_uuid)
    if (!trustedContact) {
      return undefined
    }

    if (trustedContact.publicKey.encryption !== dto.message.sender_public_key) {
      return undefined
    }

    const decryptionResult = this.encryption.asymmetricallyDecryptMessage({
      encryptedString: dto.message.encrypted_message,
      senderPublicKey: trustedContact.publicKey.encryption,
      trustedSenderSigningPublicKey: trustedContact.publicKey.signing,
      privateKey: dto.privateKey,
    })

    if (!decryptionResult || !decryptionResult.signing.trustedSenderSignaturePasses) {
      return undefined
    }

    return decryptionResult.message as M
  }
}
