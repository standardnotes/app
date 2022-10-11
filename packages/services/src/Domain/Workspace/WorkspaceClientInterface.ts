import { Uuid, WorkspaceAccessLevel, WorkspaceType } from '@standardnotes/common'
import { Workspace, WorkspaceUser } from '@standardnotes/models'

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
    workspaceUuid: Uuid
    accessLevel: WorkspaceAccessLevel
  }): Promise<{ uuid: string } | null>
  acceptInvite(dto: {
    inviteUuid: Uuid
    userUuid: Uuid
    publicKey: string
    encryptedPrivateKey: string
  }): Promise<{ success: boolean }>
  listWorkspaces(): Promise<{ ownedWorkspaces: Array<Workspace>; joinedWorkspaces: Array<Workspace> }>
  listWorkspaceUsers(dto: { workspaceUuid: Uuid }): Promise<{ users: Array<WorkspaceUser> }>
}
