export const SharedVaultUsersPaths = {
  getSharedVaultUsers: (sharedVaultUuid: string) => `/v1/shared-vaults/${sharedVaultUuid}/users`,
  deleteSharedVaultUser: (sharedVaultUuid: string, userUuid: string) =>
    `/v1/shared-vaults/${sharedVaultUuid}/users/${userUuid}`,
}
