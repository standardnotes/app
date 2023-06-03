export const SharedVaultsPaths = {
  getSharedVaults: '/v1/shared-vaults',
  createSharedVault: '/v1/shared-vaults',
  deleteSharedVault: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}`,
  updateSharedVault: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}`,
  addItemToSharedVault: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/add-item`,
  removeItemFromSharedVault: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/remove-item`,
  getRemovedSharedVaults: '/v1/shared-vaults/removed',
  createSharedVaultFileValetToken: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/valet-tokens`,
}
