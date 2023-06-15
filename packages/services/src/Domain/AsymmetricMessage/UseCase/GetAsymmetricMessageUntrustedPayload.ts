import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'

export class GetAsymmetricMessageUntrustedPayload<M extends AsymmetricMessagePayload> {
  constructor(private encryption: EncryptionProviderInterface) {}

  execute(dto: { privateKey: string; message: AsymmetricMessageServerHash }): M | undefined {
    const decryptionResult = this.encryption.asymmetricallyDecryptMessage({
      encryptedString: dto.message.encrypted_message,
      trustedSenderPublicKey: undefined,
      trustedSenderSigningPublicKey: undefined,
      privateKey: dto.privateKey,
    })

    if (!decryptionResult) {
      return undefined
    }

    return decryptionResult.message as M
  }
}
