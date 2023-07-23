import { ProtocolVersion, ProtocolVersionLatest } from '@standardnotes/common'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { createOperatorForVersion } from './Functions'
import { AnyOperatorInterface } from './OperatorInterface/TypeCheck'
import { EncryptionOperatorsInterface } from './EncryptionOperatorsInterface'

export class EncryptionOperators implements EncryptionOperatorsInterface {
  private operators: Record<string, AnyOperatorInterface> = {}

  constructor(private crypto: PureCryptoInterface) {
    this.crypto = crypto
  }

  public deinit(): void {
    ;(this.crypto as unknown) = undefined
    this.operators = {}
  }

  public operatorForVersion(version: ProtocolVersion): AnyOperatorInterface {
    const operatorKey = version
    let operator = this.operators[operatorKey]
    if (!operator) {
      operator = createOperatorForVersion(version, this.crypto)
      this.operators[operatorKey] = operator
    }
    return operator
  }

  /**
   * Returns the operator corresponding to the latest protocol version
   */
  public defaultOperator(): AnyOperatorInterface {
    return this.operatorForVersion(ProtocolVersionLatest)
  }
}
