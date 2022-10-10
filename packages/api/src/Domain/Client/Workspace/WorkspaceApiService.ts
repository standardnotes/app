import { Uuid, WorkspaceType } from '@standardnotes/common'

import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceServerInterface } from '../../Server/Workspace/WorkspaceServerInterface'

import { WorkspaceApiServiceInterface } from './WorkspaceApiServiceInterface'
import { WorkspaceApiOperations } from './WorkspaceApiOperations'

import { WorkspaceInvitationResponse } from '../../Response'

export class WorkspaceApiService implements WorkspaceApiServiceInterface {
  private operationsInProgress: Map<WorkspaceApiOperations, boolean>

  constructor(private workspaceServer: WorkspaceServerInterface) {
    this.operationsInProgress = new Map()
  }

  async inviteToWorkspace(dto: { inviteeEmail: string; workspaceUuid: Uuid }): Promise<WorkspaceInvitationResponse> {
    if (this.operationsInProgress.get(WorkspaceApiOperations.Inviting)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(WorkspaceApiOperations.Inviting, true)

    try {
      const response = await this.workspaceServer.inviteToWorkspace({
        inviteeEmail: dto.inviteeEmail,
        workspaceUuid: dto.workspaceUuid,
      })

      this.operationsInProgress.set(WorkspaceApiOperations.Inviting, false)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }

  async createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<WorkspaceCreationResponse> {
    if (this.operationsInProgress.get(WorkspaceApiOperations.Creating)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(WorkspaceApiOperations.Creating, true)

    try {
      const response = await this.workspaceServer.createWorkspace({
        workspaceType: dto.workspaceType,
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
