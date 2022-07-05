import { Uuid, ContentType } from '@standardnotes/common'

export interface SortableItem {
  uuid: Uuid
  content_type: ContentType
  created_at: Date
  userModifiedDate: Date
  title?: string
  pinned: boolean
}

export const CollectionSort: Record<string, keyof SortableItem> = {
  CreatedAt: 'created_at',
  UpdatedAt: 'userModifiedDate',
  Title: 'title',
}

export type CollectionSortDirection = 'asc' | 'dsc'

export type CollectionSortProperty = keyof SortableItem
