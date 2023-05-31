export const GroupUsersPaths = {
  getGroupUsers: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
  deleteGroupUser: (groupUuid: string, userUuid: string) => `/v1/groups/${groupUuid}/users/${userUuid}`,
}
