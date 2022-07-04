import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { ProtocolVersion, ProtocolVersionLatest } from '@standardnotes/common'
import { createOperatorForVersion } from './Functions'
import { AsynchronousOperator, SynchronousOperator } from './Operator'

export class OperatorManager {
  private operators: Record<string, AsynchronousOperator | SynchronousOperator> = {}

  constructor(private crypto: PureCryptoInterface) {
    this.crypto = crypto
  }

  public deinit(): void {
    ;(this.crypto as unknown) = undefined
    this.operators = {}
  }

  public operatorForVersion(version: ProtocolVersion): SynchronousOperator | AsynchronousOperator {
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
  public defaultOperator(): SynchronousOperator | AsynchronousOperator {
    return this.operatorForVersion(ProtocolVersionLatest)
  }
}
