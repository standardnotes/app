import { SyncUseCaseInterface, Result } from '@standardnotes/domain-core'
import { EncryptionOperatorsInterface } from '@standardnotes/encryption'
import { AsymmetricMessagePayload, PublicKeyTrustStatus, TrustedContactInterface } from '@standardnotes/models'

export class DecryptMessage implements SyncUseCaseInterface<AsymmetricMessagePayload> {
  constructor(private operators: EncryptionOperatorsInterface) {}

  execute<M extends AsymmetricMessagePayload>(dto: {
    message: string
    sender: TrustedContactInterface | undefined
    privateKey: string
  }): Result<M> {
    const defaultOperator = this.operators.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(dto.message)
    const keyOperator = this.operators.operatorForVersion(version)

    const decryptedResult = keyOperator.asymmetricDecrypt({
      stringToDecrypt: dto.message,
      recipientSecretKey: dto.privateKey,
    })

    if (!decryptedResult) {
      return Result.fail('Failed to decrypt message')
    }

    if (!decryptedResult.signatureVerified) {
      return Result.fail('Failed to verify signature')
    }

    if (dto.sender) {
      const publicKeyTrustStatus = dto.sender.getTrustStatusForPublicKey(decryptedResult.senderPublicKey)
      if (publicKeyTrustStatus !== PublicKeyTrustStatus.Trusted) {
        return Result.fail('Sender public key is not trusted')
      }

      const signingKeyTrustStatus = dto.sender.getTrustStatusForSigningPublicKey(decryptedResult.signaturePublicKey)
      if (signingKeyTrustStatus !== PublicKeyTrustStatus.Trusted) {
        return Result.fail('Signature public key is not trusted')
      }
    }

    return Result.ok(JSON.parse(decryptedResult.plaintext))
  }
}
