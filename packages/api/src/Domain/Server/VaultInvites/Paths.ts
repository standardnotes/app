export const VaultInvitesPaths = {
  createInvite: (vaultUuid: string) => `/v1/vaults/${vaultUuid}/invites`,
  updateInvite: (vaultUuid: string, inviteUuid: string) => `/v1/vaults/${vaultUuid}/invites/${inviteUuid}`,
  acceptInvite: (vaultUuid: string, inviteUuid: string) => `/v1/vaults/${vaultUuid}/invites/${inviteUuid}/accept`,
  declineInvite: (vaultUuid: string, inviteUuid: string) => `/v1/vaults/${vaultUuid}/invites/${inviteUuid}/decline`,
  getInboundUserInvites: () => '/v1/vaults/invites',
  getOutboundUserInvites: () => '/v1/vaults/invites/outbound',
  getVaultInvites: (vaultUuid: string) => `/v1/vaults/${vaultUuid}/invites`,
  deleteInvite: (vaultUuid: string, inviteUuid: string) => `/v1/vaults/${vaultUuid}/invites/${inviteUuid}`,
  deleteAllInboundInvites: '/v1/vaults/invites/inbound',
}
