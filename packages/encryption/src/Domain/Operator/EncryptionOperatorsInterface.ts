import { ProtocolVersion } from '@standardnotes/models'
import { AnyOperatorInterface } from './OperatorInterface/TypeCheck'

export interface EncryptionOperatorsInterface {
  operatorForVersion(version: ProtocolVersion): AnyOperatorInterface
  defaultOperator(): AnyOperatorInterface
  deinit(): void
}
