import { AsyncOperatorInterface } from './AsyncOperatorInterface'
import { OperatorInterface } from './OperatorInterface'
import { SyncOperatorInterface } from './SyncOperatorInterface'

export type AnyOperatorInterface = OperatorInterface & (AsyncOperatorInterface | SyncOperatorInterface)

export function isAsyncOperator(operator: unknown): operator is AsyncOperatorInterface {
  return 'generateEncryptedParametersAsync' in (operator as AsyncOperatorInterface)
}

export function isSyncOperator(operator: unknown): operator is SyncOperatorInterface {
  return !isAsyncOperator(operator)
}
