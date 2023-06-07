import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { SharedVaultMessage } from '@standardnotes/models'

export class GetInviteTrustedMessage<M extends SharedVaultMessage> {
  constructor(private encryption: EncryptionProviderInterface, private contacts: ContactServiceInterface) {}

  execute(dto: { privateKey: string; invite: SharedVaultInviteServerHash }): M | undefined {
    const trustedContact = this.contacts.findTrustedContact(dto.invite.inviter_uuid)
    if (!trustedContact) {
      return undefined
    }

    if (trustedContact.publicKey.encryption !== dto.invite.sender_public_key) {
      return undefined
    }

    const decryptionResult = this.encryption.asymmetricallyDecryptSharedVaultMessage({
      encryptedString: dto.invite.encrypted_message,
      senderPublicKey: trustedContact.publicKey.encryption,
      trustedSenderSigningPublicKey: trustedContact.publicKey.signing,
      privateKey: dto.privateKey,
    })

    if (!decryptionResult || !decryptionResult.signatureVerified) {
      return undefined
    }

    return decryptionResult.message as M
  }
}
