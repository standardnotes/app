import { ContentType } from '@standardnotes/common'

export type SharedItemsUserShare = {
  itemUuid: string
  createdAt: Date
  publicKey: string
  shareToken: string
  contentType: ContentType
  encryptedContentKey: string
}
