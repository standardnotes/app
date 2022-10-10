import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { WorkspaceInvitationRequestParams } from '../../Request/Workspace/WorkspaceInvitationRequestParams'
import { WorkspaceCreationRequestParams } from '../../Request/Workspace/WorkspaceCreationRequestParams'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'

import { Paths } from './Paths'
import { WorkspaceServerInterface } from './WorkspaceServerInterface'

export class WorkspaceServer implements WorkspaceServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async inviteToWorkspace(params: WorkspaceInvitationRequestParams): Promise<WorkspaceInvitationResponse> {
    const response = await this.httpService.post(Paths.v1.inviteToWorkspace(params.workspaceUuid), params)

    return response as WorkspaceInvitationResponse
  }

  async createWorkspace(params: WorkspaceCreationRequestParams): Promise<WorkspaceCreationResponse> {
    const response = await this.httpService.post(Paths.v1.createWorkspace, params)

    return response as WorkspaceCreationResponse
  }
}
