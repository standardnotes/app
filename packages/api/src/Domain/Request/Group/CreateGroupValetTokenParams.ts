import { ValetTokenOperation } from '@standardnotes/responses'
import { GroupMoveType } from './GroupMoveType'

export type CreateGroupValetTokenParams = {
  groupUuid: string
  fileUuid?: string
  remoteIdentifier: string
  operation: ValetTokenOperation
  unencryptedFileSize?: number
  moveOperationType?: GroupMoveType
  groupToGroupMoveTargetUuid?: string
}
