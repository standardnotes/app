import { FeatureIdentifier } from '@standardnotes/features'
import { NewNoteTitleFormat } from '../UserPrefs'
import { CollectionSortProperty } from './../../Runtime/Collection/CollectionSort'

export interface TagPreferences {
  sortBy?: CollectionSortProperty
  sortReverse?: boolean
  showArchived?: boolean
  showTrashed?: boolean
  hideProtected?: boolean
  hidePinned?: boolean
  hideNotePreview?: boolean
  hideDate?: boolean
  hideTags?: boolean
  hideEditorIcon?: boolean
  newNoteTitleFormat?: NewNoteTitleFormat
  customNoteTitleFormat?: string
  editorIdentifier?: FeatureIdentifier | string
  entryMode?: 'normal' | 'daily'
  panelWidth?: number
}
