const WorkspacePaths = {
  createWorkspace: '/v1/workspaces',
  listWorkspaces: '/v1/workspaces',
  listWorkspaceUsers: (uuid: string) => `/v1/workspaces/${uuid}/users`,
  initiateKeyshare: (worksapceUuid: string, userUuid: string) =>
    `/v1/workspaces/${worksapceUuid}/users/${userUuid}/keyshare`,
  inviteToWorkspace: (uuid: string) => `/v1/workspaces/${uuid}/invites`,
  acceptInvite: (uuid: string) => `/v1/invites/${uuid}/accept`,
}

export const Paths = {
  v1: {
    ...WorkspacePaths,
  },
}
