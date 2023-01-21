import { WorkspaceAccessLevel } from '@standardnotes/common'

export type WorkspaceInvitationRequestParams = {
  workspaceUuid: string
  inviteeEmail: string
  accessLevel: WorkspaceAccessLevel
  [additionalParam: string]: unknown
}
