import { WorkspaceApiServiceInterface } from '@standardnotes/api'
import { Uuid, WorkspaceType } from '@standardnotes/common'
import { Workspace } from '@standardnotes/models'

import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { WorkspaceClientInterface } from './WorkspaceClientInterface'

export class WorkspaceManager extends AbstractService implements WorkspaceClientInterface {
  constructor(
    private workspaceApiService: WorkspaceApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async listWorkspaces(): Promise<{ ownedWorkspaces: Workspace[]; joinedWorkspaces: Workspace[] }> {
    try {
      const result = await this.workspaceApiService.listWorkspaces()

      if (result.data.error !== undefined) {
        return { ownedWorkspaces: [], joinedWorkspaces: [] }
      }

      return result.data
    } catch (error) {
      return { ownedWorkspaces: [], joinedWorkspaces: [] }
    }
  }

  async acceptInvite(dto: {
    inviteUuid: string
    userUuid: string
    publicKey: string
    encryptedPrivateKey: string
  }): Promise<{ success: boolean }> {
    try {
      const result = await this.workspaceApiService.acceptInvite(dto)

      if (result.data.error !== undefined) {
        return { success: false }
      }

      return result.data
    } catch (error) {
      return { success: false }
    }
  }

  async inviteToWorkspace(dto: { inviteeEmail: string; workspaceUuid: Uuid }): Promise<{ uuid: string } | null> {
    try {
      const result = await this.workspaceApiService.inviteToWorkspace(dto)

      if (result.data.error !== undefined) {
        return null
      }

      return result.data
    } catch (error) {
      return null
    }
  }

  async createWorkspace(dto: {
    workspaceType: WorkspaceType
    encryptedWorkspaceKey?: string
    encryptedPrivateKey?: string
    publicKey?: string
    workspaceName?: string
  }): Promise<{ uuid: string } | null> {
    try {
      const result = await this.workspaceApiService.createWorkspace(dto)

      if (result.data.error !== undefined) {
        return null
      }

      return result.data
    } catch (error) {
      return null
    }
  }
}
