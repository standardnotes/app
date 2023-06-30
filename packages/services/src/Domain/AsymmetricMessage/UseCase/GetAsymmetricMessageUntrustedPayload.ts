import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'

export class GetAsymmetricMessageUntrustedPayload<M extends AsymmetricMessagePayload> {
  constructor(private encryption: EncryptionProviderInterface) {}

  execute(dto: { privateKey: string; message: AsymmetricMessageServerHash }): M | undefined {
    const decryptionResult = this.encryption.asymmetricallyDecryptMessage<M>({
      encryptedString: dto.message.encrypted_message,
      trustedSender: undefined,
      privateKey: dto.privateKey,
    })

    return decryptionResult
  }
}
