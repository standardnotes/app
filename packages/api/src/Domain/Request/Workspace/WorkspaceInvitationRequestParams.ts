import { Uuid, WorkspaceAccessLevel } from '@standardnotes/common'

export type WorkspaceInvitationRequestParams = {
  workspaceUuid: Uuid
  inviteeEmail: string
  accessLevel: WorkspaceAccessLevel
  [additionalParam: string]: unknown
}
