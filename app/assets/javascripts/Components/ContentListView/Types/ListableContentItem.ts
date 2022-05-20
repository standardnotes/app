import { ContentType, DecryptedItem, ItemContent } from '@standardnotes/snjs'

export type ListableContentItem = DecryptedItem<ItemContent> & {
  title: string
  protected: boolean
  uuid: string
  content_type: ContentType
  updatedAtString?: string
  createdAtString?: string
  hidePreview?: boolean
  preview_html?: string
  preview_plain?: string
  text?: string
}
