import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { ContentType, DecryptedItem, ItemContent, SortableItem } from '@standardnotes/snjs'

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

export type BaseListItemProps = {
  application: WebApplication
  appState: AppState
  hideDate: boolean
  hideIcon: boolean
  hideTags: boolean
  hidePreview: boolean
  item: ListableContentItem
  selected: boolean
  sortBy: keyof SortableItem | undefined
}

export type DisplayableListItemProps = BaseListItemProps & {
  tags: string[]
}
