export interface SortableItem {
  uuid: string
  content_type: string
  created_at: Date
  userModifiedDate: Date
  title?: string
  pinned: boolean
  decryptedSize?: number
}

export const CollectionSort: Record<string, keyof SortableItem> = {
  CreatedAt: 'created_at',
  UpdatedAt: 'userModifiedDate',
  Title: 'title',
}

export type CollectionSortDirection = 'asc' | 'dsc'

export type CollectionSortProperty = keyof SortableItem
