import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { WorkspaceInvitationRequestParams } from '../../Request/Workspace/WorkspaceInvitationRequestParams'
import { WorkspaceCreationRequestParams } from '../../Request/Workspace/WorkspaceCreationRequestParams'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingRequestParams } from '../../Request/Workspace/WorkspaceInvitationAcceptingRequestParams'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'
import { WorkspaceListRequestParams } from '../../Request/Workspace/WorkspaceListRequestParams'
import { WorkspaceListResponse } from '../../Response/Workspace/WorkspaceListResponse'

import { Paths } from './Paths'
import { WorkspaceServerInterface } from './WorkspaceServerInterface'

export class WorkspaceServer implements WorkspaceServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async listWorkspaces(params: WorkspaceListRequestParams): Promise<WorkspaceListResponse> {
    const response = await this.httpService.get(Paths.v1.listWorkspaces, params)

    return response as WorkspaceListResponse
  }

  async acceptInvite(params: WorkspaceInvitationAcceptingRequestParams): Promise<WorkspaceInvitationAcceptingResponse> {
    const response = await this.httpService.post(Paths.v1.acceptInvite(params.inviteUuid), params)

    return response as WorkspaceInvitationAcceptingResponse
  }

  async inviteToWorkspace(params: WorkspaceInvitationRequestParams): Promise<WorkspaceInvitationResponse> {
    const response = await this.httpService.post(Paths.v1.inviteToWorkspace(params.workspaceUuid), params)

    return response as WorkspaceInvitationResponse
  }

  async createWorkspace(params: WorkspaceCreationRequestParams): Promise<WorkspaceCreationResponse> {
    const response = await this.httpService.post(Paths.v1.createWorkspace, params)

    return response as WorkspaceCreationResponse
  }
}
