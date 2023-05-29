import { ValetTokenOperation } from '@standardnotes/responses'
import { VaultMoveType } from './VaultMoveType'

export type CreateVaultValetTokenParams = {
  vaultUuid: string
  fileUuid?: string
  remoteIdentifier: string
  operation: ValetTokenOperation
  unencryptedFileSize?: number
  moveOperationType?: VaultMoveType
  vaultToVaultMoveTargetUuid?: string
}
