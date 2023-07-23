import { SyncUseCaseInterface, Result } from '@standardnotes/domain-core'
import { AsymmetricallyEncryptedString, EncryptionOperatorsInterface } from '@standardnotes/encryption'
import { AsymmetricItemAdditionalData } from '@standardnotes/encryption/src/Domain/Types/EncryptionAdditionalData'

export class GetMessageAdditionalData implements SyncUseCaseInterface<AsymmetricItemAdditionalData> {
  constructor(private operators: EncryptionOperatorsInterface) {}

  execute(dto: { message: AsymmetricallyEncryptedString }): Result<AsymmetricItemAdditionalData> {
    const operator = this.operators.defaultOperator()

    return operator.asymmetricStringGetAdditionalData({ encryptedString: dto.message })
  }
}
