export const SharedVaultsPaths = {
  getSharedVaults: '/v1/shared-vaults',
  createSharedVault: '/v1/shared-vaults',
  deleteSharedVault: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}`,
  updateSharedVault: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}`,
  createSharedVaultFileValetToken: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/valet-tokens`,
}
