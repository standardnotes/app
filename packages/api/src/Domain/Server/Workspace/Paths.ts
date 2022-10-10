import { Uuid } from '@standardnotes/common'

const WorkspacePaths = {
  createWorkspace: '/v1/workspaces',
  inviteToWorkspace: (uuid: Uuid) => `/v1/workspaces/${uuid}/invites`,
}

export const Paths = {
  v1: {
    ...WorkspacePaths,
  },
}
