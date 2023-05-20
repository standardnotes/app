export const GroupsPaths = {
  createGroup: '/v1/groups',
  deleteGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
  inviteUserToGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
  removeUserFromGroup: (groupUuid: string, userUuid: string) => `/v1/groups/${groupUuid}/users/${userUuid}`,
  getGroupUsers: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
}
