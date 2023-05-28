export const VaultsPaths = {
  getVaults: '/v1/vaults',
  createVault: '/v1/vaults',
  deleteVault: (vaultUuid: string) => `/v1/vaults/${vaultUuid}`,
  updateVault: (vaultUuid: string) => `/v1/vaults/${vaultUuid}`,
  createFileValetToken: (vaultUuid: string) => `/v1/vaults/${vaultUuid}/valet-tokens`,
}
