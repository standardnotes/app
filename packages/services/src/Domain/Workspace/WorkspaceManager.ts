import { WorkspaceApiServiceInterface } from '@standardnotes/api'
import { WorkspaceType } from '@standardnotes/common'

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

  async createWorkspace(dto: {
    workspaceType: WorkspaceType,
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
