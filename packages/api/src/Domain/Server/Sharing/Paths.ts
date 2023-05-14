export const SharingPaths = {
  createShareGroup: '/v1/groups',
  getShareGroups: '/v1/groups',
  addUserToShareGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
  addItemToShareGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/items`,
}
