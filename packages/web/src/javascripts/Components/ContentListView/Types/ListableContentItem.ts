import { DecryptedItem, ItemContent } from '@standardnotes/snjs'

export type ListableContentItem = DecryptedItem<ItemContent> & {
  title: string
  protected: boolean
  updatedAtString?: string
  createdAtString?: string
  hidePreview?: boolean
  preview_html?: string
  preview_plain?: string
  text?: string
}
