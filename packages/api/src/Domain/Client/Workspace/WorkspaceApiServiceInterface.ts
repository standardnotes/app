import { WorkspaceCreationResponse } from '../../Response'

export interface WorkspaceApiServiceInterface {
  createWorkspace(dto: {
    encryptedWorkspaceKey: string
    encryptedPrivateKey: string
    publicKey: string
    workspaceName?: string
  }): Promise<WorkspaceCreationResponse>
}
