export const GroupInvitesPaths = {
  createInvite: (groupUuid: string) => `/v1/groups/${groupUuid}/invites`,
  updateInvite: (groupUuid: string, inviteUuid: string) => `/v1/groups/${groupUuid}/invites/${inviteUuid}`,
  acceptInvite: (groupUuid: string, inviteUuid: string) => `/v1/groups/${groupUuid}/invites/${inviteUuid}/accept`,
  declineInvite: (groupUuid: string, inviteUuid: string) => `/v1/groups/${groupUuid}/invites/${inviteUuid}/decline`,
  getInboundUserInvites: () => '/v1/groups/invites',
  getOutboundUserInvites: () => '/v1/groups/invites/outbound',
  getGroupInvites: (groupUuid: string) => `/v1/groups/${groupUuid}/invites`,
  deleteInvite: (groupUuid: string, inviteUuid: string) => `/v1/groups/${groupUuid}/invites/${inviteUuid}`,
  deleteAllInboundInvites: '/v1/groups/invites/inbound',
}
