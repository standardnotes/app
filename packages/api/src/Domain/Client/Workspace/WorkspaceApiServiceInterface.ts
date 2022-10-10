import { WorkspaceType } from '@standardnotes/common'

import { WorkspaceCreationResponse } from '../../Response'

export interface WorkspaceApiServiceInterface {
  createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<WorkspaceCreationResponse>
}
