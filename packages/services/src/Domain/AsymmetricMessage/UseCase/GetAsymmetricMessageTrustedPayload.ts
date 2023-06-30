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

    const decryptionResult = this.encryption.asymmetricallyDecryptMessage<M>({
      encryptedString: dto.message.encrypted_message,
      trustedSender: trustedContact,
      privateKey: dto.privateKey,
    })

    return decryptionResult
  }
}
