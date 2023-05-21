export const GroupsPaths = {
  createGroup: '/v1/groups',
  deleteGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
  updateGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
}
