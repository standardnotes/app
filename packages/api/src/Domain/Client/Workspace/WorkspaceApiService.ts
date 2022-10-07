import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceServerInterface } from '../../Server/Workspace/WorkspaceServerInterface'

import { WorkspaceApiServiceInterface } from './WorkspaceApiServiceInterface'
import { WorkspaceApiOperations } from './WorkspaceApiOperations'

export class WorkspaceApiService implements WorkspaceApiServiceInterface {
  private operationsInProgress: Map<WorkspaceApiOperations, boolean>

  constructor(private workspaceServer: WorkspaceServerInterface) {
    this.operationsInProgress = new Map()
  }

  async createWorkspace(dto: { encryptedWorkspaceKey: string, encryptedPrivateKey: string, publicKey: string, workspaceName?: string }): Promise<WorkspaceCreationResponse> {
    if (this.operationsInProgress.get(WorkspaceApiOperations.Creating)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(WorkspaceApiOperations.Creating, true)

    try {
      const response = await this.workspaceServer.createWorkspace({
        encryptedPrivateKey: dto.encryptedPrivateKey,
        encryptedWorkspaceKey: dto.encryptedWorkspaceKey,
        publicKey: dto.publicKey,
        workspaceName: dto.workspaceName,
      })

      this.operationsInProgress.set(WorkspaceApiOperations.Creating, false)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }
}
