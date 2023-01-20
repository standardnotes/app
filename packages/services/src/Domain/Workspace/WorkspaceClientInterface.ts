import { WorkspaceAccessLevel, WorkspaceType } from '@standardnotes/common'
import { Workspace, WorkspaceUser } from '@standardnotes/api'

export interface WorkspaceClientInterface {
  createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<{ uuid: string } | null>
  inviteToWorkspace(dto: {
    inviteeEmail: string
    workspaceUuid: string
    accessLevel: WorkspaceAccessLevel
  }): Promise<{ uuid: string } | null>
  acceptInvite(dto: {
    inviteUuid: string
    userUuid: string
    publicKey: string
    encryptedPrivateKey: string
  }): Promise<{ success: boolean }>
  listWorkspaces(): Promise<{ ownedWorkspaces: Array<Workspace>; joinedWorkspaces: Array<Workspace> }>
  listWorkspaceUsers(dto: { workspaceUuid: string }): Promise<{ users: Array<WorkspaceUser> }>
  initiateKeyshare(dto: {
    workspaceUuid: string
    userUuid: string
    encryptedWorkspaceKey: string
  }): Promise<{ success: boolean }>
}
