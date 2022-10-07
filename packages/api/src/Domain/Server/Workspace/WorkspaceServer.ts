import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { WorkspaceCreationRequestParams } from '../../Request/Workspace/WorkspaceCreationRequestParams'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'

import { Paths } from './Paths'
import { WorkspaceServerInterface } from './WorkspaceServerInterface'

export class WorkspaceServer implements WorkspaceServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async createWorkspace(params: WorkspaceCreationRequestParams): Promise<WorkspaceCreationResponse> {
    const response = await this.httpService.post(Paths.v1.createWorkspace, params)

    return response as WorkspaceCreationResponse
  }
}
