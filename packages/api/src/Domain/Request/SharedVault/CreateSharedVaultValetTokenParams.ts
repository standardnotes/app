import { SharedVaultMoveType, ValetTokenOperation } from '@standardnotes/responses'

export type CreateSharedVaultValetTokenParams = {
  sharedVaultUuid: string
  fileUuid?: string
  remoteIdentifier: string
  operation: ValetTokenOperation
  unencryptedFileSize?: number
  moveOperationType?: SharedVaultMoveType
  sharedVaultToSharedVaultMoveTargetUuid?: string
  sharedVaultOwnerUuid?: string
}
