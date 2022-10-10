import { Uuid } from '@standardnotes/common'

export type WorkspaceInvitationRequestParams = {
  workspaceUuid: Uuid
  inviteeEmail: string
  [additionalParam: string]: unknown
}
