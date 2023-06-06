import { ProtocolVersion, ProtocolVersionLatest } from '@standardnotes/common'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { createOperatorForVersion } from './Functions'
import { OperatorInterface } from './OperatorInterface'

export class OperatorManager {
  private operators: Record<string, OperatorInterface> = {}

  constructor(private crypto: PureCryptoInterface) {
    this.crypto = crypto
  }

  public deinit(): void {
    ;(this.crypto as unknown) = undefined
    this.operators = {}
  }

  public operatorForVersion(version: ProtocolVersion): OperatorInterface {
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
  public defaultOperator(): OperatorInterface {
    return this.operatorForVersion(ProtocolVersionLatest)
  }
}
