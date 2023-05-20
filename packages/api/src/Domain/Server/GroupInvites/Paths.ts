export const GroupInvitesPaths = {
  createInvite: (groupUuid: string) => `/v1/groups/${groupUuid}/invites`,
  acceptInvite: (groupUuid: string, inviteUuid: string) => `/v1/groups/${groupUuid}/invites/${inviteUuid}/accept`,
  declineInvite: (groupUuid: string, inviteUuid: string) => `/v1/groups/${groupUuid}/invites/${inviteUuid}/decline`,
  getUserInvites: () => '/v1/groups/invites',
  getGroupInvites: (groupUuid: string) => `/v1/groups/${groupUuid}/invites`,
  deleteInvite: (groupUuid: string, inviteUuid: string) => `/v1/groups/${groupUuid}/invites/${inviteUuid}`,
}
