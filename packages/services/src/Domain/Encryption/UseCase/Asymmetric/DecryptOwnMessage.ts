import { SyncUseCaseInterface, Result } from '@standardnotes/domain-core'
import { OperatorManager } from '@standardnotes/encryption'
import { AsymmetricMessagePayload } from '@standardnotes/models'

export class DecryptOwnMessage<M extends AsymmetricMessagePayload> implements SyncUseCaseInterface<M> {
  constructor(private operators: OperatorManager) {}

  execute(dto: { message: string; privateKey: string; recipientPublicKey: string }): Result<M> {
    const defaultOperator = this.operators.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(dto.message)
    const keyOperator = this.operators.operatorForVersion(version)

    const result = keyOperator.asymmetricDecryptOwnMessage({
      message: dto.message,
      ownPrivateKey: dto.privateKey,
      recipientPublicKey: dto.recipientPublicKey,
    })

    if (result.isFailed()) {
      return Result.fail(result.getError())
    }

    const decryptedObject = result.getValue()

    if (!decryptedObject.signatureVerified) {
      return Result.fail('Failed to verify signature')
    }

    return Result.ok(JSON.parse(decryptedObject.plaintext))
  }
}
