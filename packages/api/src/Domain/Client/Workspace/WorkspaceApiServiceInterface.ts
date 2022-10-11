import { Uuid, WorkspaceType } from '@standardnotes/common'

import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceListResponse } from '../../Response/Workspace/WorkspaceListResponse'

export interface WorkspaceApiServiceInterface {
  createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<WorkspaceCreationResponse>
  inviteToWorkspace(dto: { inviteeEmail: string; workspaceUuid: Uuid }): Promise<WorkspaceInvitationResponse>
  acceptInvite(dto: {
    inviteUuid: Uuid
    userUuid: Uuid
    publicKey: string
    encryptedPrivateKey: string
  }): Promise<WorkspaceInvitationAcceptingResponse>
  listWorkspaces(): Promise<WorkspaceListResponse>
}
