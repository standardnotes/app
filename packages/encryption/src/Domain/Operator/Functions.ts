import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SNProtocolOperator001 } from '../Operator/001/Operator001'
import { SNProtocolOperator002 } from '../Operator/002/Operator002'
import { SNProtocolOperator003 } from '../Operator/003/Operator003'
import { SNProtocolOperator004 } from '../Operator/004/Operator004'
import { AsynchronousOperator, SynchronousOperator } from '../Operator/Operator'
import { ProtocolVersion } from '@standardnotes/common'

export function createOperatorForVersion(
  version: ProtocolVersion,
  crypto: PureCryptoInterface,
): AsynchronousOperator | SynchronousOperator {
  if (version === ProtocolVersion.V001) {
    return new SNProtocolOperator001(crypto)
  } else if (version === ProtocolVersion.V002) {
    return new SNProtocolOperator002(crypto)
  } else if (version === ProtocolVersion.V003) {
    return new SNProtocolOperator003(crypto)
  } else if (version === ProtocolVersion.V004) {
    return new SNProtocolOperator004(crypto)
  } else {
    throw Error(`Unable to find operator for version ${version}`)
  }
}

export function isAsyncOperator(
  operator: AsynchronousOperator | SynchronousOperator,
): operator is AsynchronousOperator {
  return (operator as AsynchronousOperator).generateDecryptedParametersAsync !== undefined
}
