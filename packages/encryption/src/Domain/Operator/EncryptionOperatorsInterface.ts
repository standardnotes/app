import { ProtocolVersion } from '@standardnotes/common';
import { AnyOperatorInterface } from './OperatorInterface/TypeCheck';


export interface EncryptionOperatorsInterface {
  operatorForVersion(version: ProtocolVersion): AnyOperatorInterface;
  defaultOperator(): AnyOperatorInterface;
  deinit(): void;
}
