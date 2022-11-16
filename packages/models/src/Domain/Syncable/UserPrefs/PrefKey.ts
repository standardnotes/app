import { CollectionSortProperty } from '../../Runtime/Collection/CollectionSort'
import { EditorIdentifier, FeatureIdentifier } from '@standardnotes/features'

export enum PrefKey {
  TagsPanelWidth = 'tagsPanelWidth',
  NotesPanelWidth = 'notesPanelWidth',
  EditorWidth = 'editorWidth',
  EditorLeft = 'editorLeft',
  EditorMonospaceEnabled = 'monospaceFont',
  EditorSpellcheck = 'spellcheck',
  EditorResizersEnabled = 'marginResizersEnabled',
  EditorLineHeight = 'editorLineHeight',
  EditorFontSize = 'editorFontSize',
  SortNotesBy = 'sortBy',
  SortNotesReverse = 'sortReverse',
  NotesShowArchived = 'showArchived',
  NotesShowTrashed = 'showTrashed',
  NotesHideProtected = 'hideProtected',
  NotesHidePinned = 'hidePinned',
  NotesHideNotePreview = 'hideNotePreview',
  NotesHideDate = 'hideDate',
  NotesHideTags = 'hideTags',
  NotesHideEditorIcon = 'hideEditorIcon',
  UseSystemColorScheme = 'useSystemColorScheme',
  AutoLightThemeIdentifier = 'autoLightThemeIdentifier',
  AutoDarkThemeIdentifier = 'autoDarkThemeIdentifier',
  NoteAddToParentFolders = 'noteAddToParentFolders',
  MobileSortNotesBy = 'mobileSortBy',
  MobileSortNotesReverse = 'mobileSortReverse',
  MobileNotesHideNotePreview = 'mobileHideNotePreview',
  MobileNotesHideDate = 'mobileHideDate',
  MobileNotesHideTags = 'mobileHideTags',
  MobileLastExportDate = 'mobileLastExportDate',
  MobileDoNotShowAgainUnsupportedEditors = 'mobileDoNotShowAgainUnsupportedEditors',
  MobileSelectedTagUuid = 'mobileSelectedTagUuid',
  MobileNotesHideEditorIcon = 'mobileHideEditorIcon',
  NewNoteTitleFormat = 'newNoteTitleFormat',
  CustomNoteTitleFormat = 'customNoteTitleFormat',
  UpdateSavingStatusIndicator = 'updateSavingStatusIndicator',
  DarkMode = 'darkMode',
  DefaultEditorIdentifier = 'defaultEditorIdentifier',
}

export enum NewNoteTitleFormat {
  CurrentDateAndTime = 'CurrentDateAndTime',
  CurrentNoteCount = 'CurrentNoteCount',
  CustomFormat = 'CustomFormat',
  Empty = 'Empty',
}

export enum EditorLineHeight {
  None = 'None',
  Tight = 'Tight',
  Snug = 'Snug',
  Normal = 'Normal',
  Relaxed = 'Relaxed',
  Loose = 'Loose',
}

export enum EditorFontSize {
  ExtraSmall = 'ExtraSmall',
  Small = 'Small',
  Normal = 'Normal',
  Medium = 'Medium',
  Large = 'Large',
}

export type PrefValue = {
  [PrefKey.TagsPanelWidth]: number
  [PrefKey.NotesPanelWidth]: number
  [PrefKey.EditorWidth]: number | null
  [PrefKey.EditorLeft]: number | null
  [PrefKey.EditorMonospaceEnabled]: boolean
  [PrefKey.EditorSpellcheck]: boolean
  [PrefKey.EditorResizersEnabled]: boolean
  [PrefKey.SortNotesBy]: CollectionSortProperty
  [PrefKey.SortNotesReverse]: boolean
  [PrefKey.NotesShowArchived]: boolean
  [PrefKey.NotesShowTrashed]: boolean
  [PrefKey.NotesHidePinned]: boolean
  [PrefKey.NotesHideProtected]: boolean
  [PrefKey.NotesHideNotePreview]: boolean
  [PrefKey.NotesHideDate]: boolean
  [PrefKey.NotesHideTags]: boolean
  [PrefKey.NotesHideEditorIcon]: boolean
  [PrefKey.UseSystemColorScheme]: boolean
  [PrefKey.AutoLightThemeIdentifier]: FeatureIdentifier | 'Default' | 'Dark'
  [PrefKey.AutoDarkThemeIdentifier]: FeatureIdentifier | 'Default' | 'Dark'
  [PrefKey.NoteAddToParentFolders]: boolean
  [PrefKey.MobileSortNotesBy]: CollectionSortProperty
  [PrefKey.MobileSortNotesReverse]: boolean
  [PrefKey.MobileNotesHideNotePreview]: boolean
  [PrefKey.MobileNotesHideDate]: boolean
  [PrefKey.MobileNotesHideTags]: boolean
  [PrefKey.MobileLastExportDate]: Date | undefined
  [PrefKey.MobileDoNotShowAgainUnsupportedEditors]: boolean
  [PrefKey.MobileSelectedTagUuid]: string | undefined
  [PrefKey.MobileNotesHideEditorIcon]: boolean
  [PrefKey.NewNoteTitleFormat]: NewNoteTitleFormat
  [PrefKey.CustomNoteTitleFormat]: string
  [PrefKey.EditorLineHeight]: EditorLineHeight
  [PrefKey.EditorFontSize]: EditorFontSize
  [PrefKey.UpdateSavingStatusIndicator]: boolean
  [PrefKey.DarkMode]: boolean
  [PrefKey.DefaultEditorIdentifier]: EditorIdentifier
}
