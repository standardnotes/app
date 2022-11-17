import { Workspace } from './../../Client/Workspace/Workspace'

export type WorkspaceListResponseBody = {
  ownedWorkspaces: Array<Workspace>
  joinedWorkspaces: Array<Workspace>
}
