import { Uuid } from '@standardnotes/common'

export type WorkspaceUserListRequestParams = {
  workspaceUuid: Uuid
  [additionalParam: string]: unknown
}
