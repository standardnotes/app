export const SharedVaultInvitesPaths = {
  createInvite: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/invites`,
  updateInvite: (sharedVaultUuid: string, inviteUuid: string) =>
    `/v1/shared-vaults/${sharedVaultUuid}/invites/${inviteUuid}`,
  acceptInvite: (sharedVaultUuid: string, inviteUuid: string) =>
    `/v1/shared-vaults/${sharedVaultUuid}/invites/${inviteUuid}/accept`,
  declineInvite: (sharedVaultUuid: string, inviteUuid: string) =>
    `/v1/shared-vaults/${sharedVaultUuid}/invites/${inviteUuid}/decline`,
  getInboundUserInvites: () => '/v1/shared-vaults/invites',
  getOutboundUserInvites: () => '/v1/shared-vaults/invites/outbound',
  getSharedVaultInvites: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/invites`,
  deleteInvite: (sharedVaultUuid: string, inviteUuid: string) =>
    `/v1/shared-vaults/${sharedVaultUuid}/invites/${inviteUuid}`,
  deleteAllSharedVaultInvites: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/invites`,
  deleteAllInboundInvites: '/v1/shared-vaults/invites/inbound',
  deleteAllOutboundInvites: '/v1/shared-vaults/invites/outbound',
}
