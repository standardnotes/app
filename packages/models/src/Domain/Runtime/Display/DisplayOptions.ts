import { ContentType } from '@standardnotes/common'
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
  hiddenContentTypes?: ContentType[]
  customFilter?: DisplayControllerCustomFilter
}

export type TagsDisplayOptions = GenericDisplayOptions

export interface DisplayControllerDisplayOptions extends GenericDisplayOptions {
  sortBy: CollectionSortProperty
  sortDirection: CollectionSortDirection
}

export type NotesAndFilesDisplayControllerOptions = NotesAndFilesDisplayOptions & DisplayControllerDisplayOptions
export type TagsDisplayControllerOptions = TagsDisplayOptions & DisplayControllerDisplayOptions
export type AnyDisplayOptions = NotesAndFilesDisplayOptions | TagsDisplayOptions | GenericDisplayOptions
