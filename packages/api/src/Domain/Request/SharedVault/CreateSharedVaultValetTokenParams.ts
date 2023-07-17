import { SharedVaultMoveType, ValetTokenOperation } from '@standardnotes/security'

export type CreateSharedVaultValetTokenParams = {
  sharedVaultUuid: string
  fileUuid?: string
  remoteIdentifier: string
  operation: ValetTokenOperation
  unencryptedFileSize?: number
  moveOperationType?: SharedVaultMoveType
  sharedVaultToSharedVaultMoveTargetUuid?: string
}
