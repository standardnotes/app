import { Uuid } from '@standardnotes/common'

export type WorkspaceKeyshareInitiatingRequestParams = {
  userUuid: Uuid
  workspaceUuid: Uuid
  encryptedWorkspaceKey: string
  [additionalParam: string]: unknown
}
