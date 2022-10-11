import { WorkspaceInvitationRequestParams } from '../../Request/Workspace/WorkspaceInvitationRequestParams'
import { WorkspaceCreationRequestParams } from '../../Request/Workspace/WorkspaceCreationRequestParams'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingRequestParams } from '../../Request/Workspace/WorkspaceInvitationAcceptingRequestParams'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'

export interface WorkspaceServerInterface {
  createWorkspace(params: WorkspaceCreationRequestParams): Promise<WorkspaceCreationResponse>
  inviteToWorkspace(params: WorkspaceInvitationRequestParams): Promise<WorkspaceInvitationResponse>
  acceptInvite(params: WorkspaceInvitationAcceptingRequestParams): Promise<WorkspaceInvitationAcceptingResponse>
}
