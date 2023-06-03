import { ValetTokenOperation } from '@standardnotes/responses'
import { SharedVaultMoveType } from './SharedVaultMoveType'

export type CreateSharedVaultValetTokenParams = {
  sharedVaultUuid: string
  fileUuid?: string
  remoteIdentifier: string
  operation: ValetTokenOperation
  unencryptedFileSize?: number
  moveOperationType?: SharedVaultMoveType
  sharedVaultToSharedVaultMoveTargetUuid?: string
}
