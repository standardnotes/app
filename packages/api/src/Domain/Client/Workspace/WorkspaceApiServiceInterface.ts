import { Uuid, WorkspaceType } from '@standardnotes/common'

import { WorkspaceCreationResponse, WorkspaceInvitationResponse } from '../../Response'

export interface WorkspaceApiServiceInterface {
  createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<WorkspaceCreationResponse>
  inviteToWorkspace(dto: { inviteeEmail: string; workspaceUuid: Uuid }): Promise<WorkspaceInvitationResponse>
}
