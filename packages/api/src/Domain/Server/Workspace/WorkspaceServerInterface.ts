import { WorkspaceCreationRequestParams } from '../../Request/Workspace/WorkspaceCreationRequestParams'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'

export interface WorkspaceServerInterface {
  createWorkspace(params: WorkspaceCreationRequestParams): Promise<WorkspaceCreationResponse>
}
