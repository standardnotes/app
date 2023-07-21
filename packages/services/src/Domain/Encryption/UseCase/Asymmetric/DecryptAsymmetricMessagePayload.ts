import { SyncUseCaseInterface, Result } from '@standardnotes/domain-core'
import { OperatorManager } from '@standardnotes/encryption'
import { AsymmetricMessagePayload, PublicKeyTrustStatus, TrustedContactInterface } from '@standardnotes/models'

export class DecryptAsymmetricMessagePayload<M extends AsymmetricMessagePayload> implements SyncUseCaseInterface<M> {
  constructor(private operators: OperatorManager) {}

  execute(dto: {
    encryptedString: string
    trustedSender: TrustedContactInterface | undefined
    privateKey: string
  }): Result<M> {
    const defaultOperator = this.operators.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(dto.encryptedString)
    const keyOperator = this.operators.operatorForVersion(version)

    const decryptedResult = keyOperator.asymmetricDecrypt({
      stringToDecrypt: dto.encryptedString,
      recipientSecretKey: dto.privateKey,
    })

    if (!decryptedResult) {
      return Result.fail('Failed to decrypt message')
    }

    if (!decryptedResult.signatureVerified) {
      return Result.fail('Failed to verify signature')
    }

    if (dto.trustedSender) {
      const publicKeyTrustStatus = dto.trustedSender.getTrustStatusForPublicKey(decryptedResult.senderPublicKey)
      if (publicKeyTrustStatus !== PublicKeyTrustStatus.TrustedRoot) {
        return Result.fail('Sender public key is not trusted')
      }

      const signingKeyTrustStatus = dto.trustedSender.getTrustStatusForSigningPublicKey(
        decryptedResult.signaturePublicKey,
      )
      if (signingKeyTrustStatus !== PublicKeyTrustStatus.TrustedRoot) {
        return Result.fail('Signature public key is not trusted')
      }
    }

    return Result.ok(JSON.parse(decryptedResult.plaintext))
  }
}
