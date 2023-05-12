import { ContentType } from '@standardnotes/common'

export type ItemShareResponseObject = {
  itemUuid: string
  createdAt: Date
  publicKey: string
  shareToken: string
  contentType: ContentType
  encryptedContentKey: string
}
