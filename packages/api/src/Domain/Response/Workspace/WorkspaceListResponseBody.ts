import { Workspace } from '@standardnotes/models'

export type WorkspaceListResponseBody = {
  ownedWorkspaces: Array<Workspace>
  joinedWorkspaces: Array<Workspace>
}
