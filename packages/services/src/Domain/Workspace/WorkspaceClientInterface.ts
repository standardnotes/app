import { Uuid, WorkspaceType } from '@standardnotes/common'

export interface WorkspaceClientInterface {
  createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<{ uuid: string } | null>
  inviteToWorkspace(dto: { inviteeEmail: string; workspaceUuid: Uuid }): Promise<{ uuid: string } | null>
}
