import { Uuid } from '@standardnotes/common'

const WorkspacePaths = {
  createWorkspace: '/v1/workspaces',
  listWorkspaces: '/v1/workspaces',
  listWorkspaceUsers: (uuid: Uuid) => `/v1/workspaces/${uuid}/users`,
  initiateKeyshare: (worksapceUuid: Uuid, userUuid: Uuid) =>
    `/v1/workspaces/${worksapceUuid}/users/${userUuid}/keyshare`,
  inviteToWorkspace: (uuid: Uuid) => `/v1/workspaces/${uuid}/invites`,
  acceptInvite: (uuid: Uuid) => `/v1/invites/${uuid}/accept`,
}

export const Paths = {
  v1: {
    ...WorkspacePaths,
  },
}
