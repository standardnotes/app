export const GroupsPaths = {
  getGroups: '/v1/groups',
  createGroup: '/v1/groups',
  deleteGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
  updateGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
  addItemToGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/items`,
  removeItemFromGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/items`,
  getRemovedGroups: '/v1/groups/removed',
  createGroupFileValetToken: (groupUuid: string) => `/v1/groups/${groupUuid}/valet-tokens`,
}
