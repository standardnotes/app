export const SharingPaths = {
  createGroup: '/v1/groups',
  getUserGroups: '/v1/groups',
  addUserToGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
  addItemToGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/items`,
}
