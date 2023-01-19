import { WorkspaceAccessLevel, WorkspaceType } from '@standardnotes/common'

import { WorkspaceKeyshareInitiatingResponse } from '../../Response/Workspace/WorkspaceKeyshareInitiatingResponse'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceListResponse } from '../../Response/Workspace/WorkspaceListResponse'
import { WorkspaceUserListResponse } from '../../Response/Workspace/WorkspaceUserListResponse'

export interface WorkspaceApiServiceInterface {
  createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<WorkspaceCreationResponse>
  inviteToWorkspace(dto: {
    inviteeEmail: string
    workspaceUuid: string
    accessLevel: WorkspaceAccessLevel
  }): Promise<WorkspaceInvitationResponse>
  acceptInvite(dto: {
    inviteUuid: string
    userUuid: string
    publicKey: string
    encryptedPrivateKey: string
  }): Promise<WorkspaceInvitationAcceptingResponse>
  listWorkspaces(): Promise<WorkspaceListResponse>
  listWorkspaceUsers(dto: { workspaceUuid: string }): Promise<WorkspaceUserListResponse>
  initiateKeyshare(dto: {
    workspaceUuid: string
    userUuid: string
    encryptedWorkspaceKey: string
  }): Promise<WorkspaceKeyshareInitiatingResponse>
}
