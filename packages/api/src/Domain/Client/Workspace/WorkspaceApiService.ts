import { Uuid, WorkspaceType } from '@standardnotes/common'

import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceServerInterface } from '../../Server/Workspace/WorkspaceServerInterface'

import { WorkspaceApiServiceInterface } from './WorkspaceApiServiceInterface'
import { WorkspaceApiOperations } from './WorkspaceApiOperations'

export class WorkspaceApiService implements WorkspaceApiServiceInterface {
  private operationsInProgress: Map<WorkspaceApiOperations, boolean>

  constructor(private workspaceServer: WorkspaceServerInterface) {
    this.operationsInProgress = new Map()
  }

  async acceptInvite(dto: {
    inviteUuid: string
    userUuid: string
    publicKey: string
    encryptedPrivateKey: string
  }): Promise<WorkspaceInvitationAcceptingResponse> {
    this.lockOperation(WorkspaceApiOperations.Accepting)

    try {
      const response = await this.workspaceServer.acceptInvite({
        encryptedPrivateKey: dto.encryptedPrivateKey,
        publicKey: dto.publicKey,
        inviteUuid: dto.inviteUuid,
        userUuid: dto.userUuid,
      })

      this.unlockOperation(WorkspaceApiOperations.Accepting)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }

  async inviteToWorkspace(dto: { inviteeEmail: string; workspaceUuid: Uuid }): Promise<WorkspaceInvitationResponse> {
    this.lockOperation(WorkspaceApiOperations.Inviting)

    try {
      const response = await this.workspaceServer.inviteToWorkspace({
        inviteeEmail: dto.inviteeEmail,
        workspaceUuid: dto.workspaceUuid,
      })

      this.unlockOperation(WorkspaceApiOperations.Inviting)

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
    this.lockOperation(WorkspaceApiOperations.Creating)

    try {
      const response = await this.workspaceServer.createWorkspace({
        workspaceType: dto.workspaceType,
        encryptedPrivateKey: dto.encryptedPrivateKey,
        encryptedWorkspaceKey: dto.encryptedWorkspaceKey,
        publicKey: dto.publicKey,
        workspaceName: dto.workspaceName,
      })

      this.unlockOperation(WorkspaceApiOperations.Creating)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }

  private lockOperation(operation: WorkspaceApiOperations): void {
    if (this.operationsInProgress.get(operation)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(operation, true)
  }

  private unlockOperation(operation: WorkspaceApiOperations): void {
    this.operationsInProgress.set(operation, false)
  }
}
