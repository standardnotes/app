export const VaultUsersPaths = {
  getVaultUsers: (vaultUuid: string) => `/v1/vaults/${vaultUuid}/users`,
  deleteVaultUser: (vaultUuid: string, userUuid: string) => `/v1/vaults/${vaultUuid}/users/${userUuid}`,
}
