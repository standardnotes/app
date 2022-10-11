import { Uuid } from '@standardnotes/common'

const WorkspacePaths = {
  createWorkspace: '/v1/workspaces',
  inviteToWorkspace: (uuid: Uuid) => `/v1/workspaces/${uuid}/invites`,
  acceptInvite: (uuid: Uuid) => `/v1/invites/${uuid}/accept`,
}

export const Paths = {
  v1: {
    ...WorkspacePaths,
  },
}
