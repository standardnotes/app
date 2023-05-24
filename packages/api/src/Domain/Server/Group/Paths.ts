export const GroupsPaths = {
  getGroups: '/v1/groups',
  createGroup: '/v1/groups',
  deleteGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
  updateGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
}
