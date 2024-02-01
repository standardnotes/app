import { SmartView } from '../../Syncable/SmartView'
import { SNTag } from '../../Syncable/Tag'
import { CollectionSortDirection, CollectionSortProperty } from '../Collection/CollectionSort'
import { SearchQuery } from './Search/Types'
import { DisplayControllerCustomFilter } from './Types'

export interface GenericDisplayOptions {
  includePinned?: boolean
  includeProtected?: boolean
  includeTrashed?: boolean
  includeArchived?: boolean
}

export interface NotesAndFilesDisplayOptions extends GenericDisplayOptions {
  tags?: SNTag[]
  views?: SmartView[]
  searchQuery?: SearchQuery
  hiddenContentTypes?: string[]
  customFilter?: DisplayControllerCustomFilter
}

export interface TagsAndViewsDisplayOptions extends GenericDisplayOptions {
  searchQuery?: SearchQuery
  customFilter?: DisplayControllerCustomFilter
}

export interface DisplayControllerDisplayOptions extends GenericDisplayOptions {
  sortBy: CollectionSortProperty
  sortDirection: CollectionSortDirection
}

export type NotesAndFilesDisplayControllerOptions = NotesAndFilesDisplayOptions & DisplayControllerDisplayOptions
export type TagsDisplayControllerOptions = TagsAndViewsDisplayOptions & DisplayControllerDisplayOptions
export type AnyDisplayOptions = NotesAndFilesDisplayOptions | TagsAndViewsDisplayOptions | GenericDisplayOptions
