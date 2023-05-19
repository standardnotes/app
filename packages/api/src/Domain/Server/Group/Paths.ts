export const SharingPaths = {
  createGroup: '/v1/groups',
  deleteGroup: (groupUuid: string) => `/v1/groups/${groupUuid}`,
  addUserToGroup: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
  removeUserFromGroup: (groupUuid: string, userUuid: string) => `/v1/groups/${groupUuid}/users/${userUuid}`,

  updateKeysForAllGroupMembers: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
  updateAllKeysRelatedToUser: (userUuid: string) => `/v1/groups/${userUuid}/user-keys`,

  getGroupUsers: (groupUuid: string) => `/v1/groups/${groupUuid}/users`,
  getReceivedUserKeysBySender: (senderUuid: string) => `/v1/groups/received-user-keys/${senderUuid}`,
  getAllUserKeysForCurrentUser: () => '/v1/groups/all-user-keys',
}
