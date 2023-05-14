import { ContentType } from '@standardnotes/common'

export type ItemShareResponseObject = {
  uuid: string
  itemUuid: string
  createdAt: Date
  permissions: string
  shareToken: string
  contentType: ContentType
  encryptedContentKey: string
}
