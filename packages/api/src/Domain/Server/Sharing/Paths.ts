export const SharingPaths = {
  getSharedItem: (shareToken: string) => `/v1/sharing/item/${shareToken}`,
  shareItem: '/v1/sharing',
  getUserShares: '/v1/sharing',
}
