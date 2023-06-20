import { ContentType } from '@standardnotes/common'
import { SmartView } from '../../Syncable/SmartView'
import { SNTag } from '../../Syncable/Tag'
import { CollectionSortDirection, CollectionSortProperty } from '../Collection/CollectionSort'
import { SearchQuery } from './Search/Types'
import { DisplayControllerCustomFilter } from './Types'
import { VaultDisplayOptions } from './VaultDisplayOptions'

export type DisplayOptions = FilterDisplayOptions & DisplayControllerOptions

export interface FilterDisplayOptions {
  tags?: SNTag[]
  views?: SmartView[]
  vaults?: VaultDisplayOptions
  searchQuery?: SearchQuery
  includePinned?: boolean
  includeProtected?: boolean
  includeTrashed?: boolean
  includeArchived?: boolean
}

export interface DisplayControllerOptions {
  sortBy: CollectionSortProperty
  sortDirection: CollectionSortDirection
  hiddenContentTypes?: ContentType[]
  customFilter?: DisplayControllerCustomFilter
}
