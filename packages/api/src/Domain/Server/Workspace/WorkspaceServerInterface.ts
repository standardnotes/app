import { WorkspaceInvitationRequestParams } from '../../Request/Workspace/WorkspaceInvitationRequestParams'
import { WorkspaceCreationRequestParams } from '../../Request/Workspace/WorkspaceCreationRequestParams'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingRequestParams } from '../../Request/Workspace/WorkspaceInvitationAcceptingRequestParams'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'
import { WorkspaceListRequestParams } from '../../Request/Workspace/WorkspaceListRequestParams'
import { WorkspaceListResponse } from '../../Response/Workspace/WorkspaceListResponse'

export interface WorkspaceServerInterface {
  createWorkspace(params: WorkspaceCreationRequestParams): Promise<WorkspaceCreationResponse>
  listWorkspaces(params: WorkspaceListRequestParams): Promise<WorkspaceListResponse>
  inviteToWorkspace(params: WorkspaceInvitationRequestParams): Promise<WorkspaceInvitationResponse>
  acceptInvite(params: WorkspaceInvitationAcceptingRequestParams): Promise<WorkspaceInvitationAcceptingResponse>
}
