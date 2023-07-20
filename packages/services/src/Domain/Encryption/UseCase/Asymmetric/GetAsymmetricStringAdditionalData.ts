import { SyncUseCaseInterface, Result } from '@standardnotes/domain-core'
import { AsymmetricallyEncryptedString, OperatorManager } from '@standardnotes/encryption'
import { AsymmetricItemAdditionalData } from '@standardnotes/encryption/src/Domain/Types/EncryptionAdditionalData'

export class GetAsymmetricStringAdditionalData implements SyncUseCaseInterface<AsymmetricItemAdditionalData> {
  constructor(private operators: OperatorManager) {}

  execute(dto: { message: AsymmetricallyEncryptedString }): Result<AsymmetricItemAdditionalData> {
    const operator = this.operators.defaultOperator()

    return operator.asymmetricStringGetAdditionalData({ encryptedString: dto.message })
  }
}
