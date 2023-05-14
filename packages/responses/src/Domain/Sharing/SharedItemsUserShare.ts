import { ContentType } from '@standardnotes/common'

export type SharedItemsUserShare = {
  uuid: string
  itemUuid: string
  createdAt: Date
  permissions: string
  shareToken: string
  contentType: ContentType
  encryptedContentKey: string
}
