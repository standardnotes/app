export const SharingUrlVersion = '1.0'

export type SharingUrlParams = {
  /** version */
  v: string
  /** shareToken */
  t: string
  /** apiHost */
  h?: string
}

export type DecodedSharingUrl = {
  version: string
  shareToken: string
  privateKey: string
  thirdPartyApiHost?: string
}
