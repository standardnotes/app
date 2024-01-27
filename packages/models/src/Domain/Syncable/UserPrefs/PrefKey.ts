import { CollectionSortProperty } from '../../Runtime/Collection/CollectionSort'
import { SystemViewId } from '../SmartView'
import { TagPreferences } from '../Tag'
import { NewNoteTitleFormat } from './NewNoteTitleFormat'
import { EditorLineHeight } from './EditorLineHeight'
import { EditorLineWidth } from './EditorLineWidth'
import { EditorFontSize } from './EditorFontSize'
import { AllComponentPreferences } from './ComponentPreferences'

export enum PrefKey {
  TagsPanelWidth = 'tagsPanelWidth',
  NotesPanelWidth = 'notesPanelWidth',
  EditorWidth = 'editorWidth',
  EditorLeft = 'editorLeft',
  EditorMonospaceEnabled = 'monospaceFont',
  EditorSpellcheck = 'spellcheck',
  EditorResizersEnabled = 'marginResizersEnabled',
  EditorLineHeight = 'editorLineHeight',
  EditorLineWidth = 'editorLineWidth',
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
  UseTranslucentUI = 'useTranslucentUI',
  AutoLightThemeIdentifier = 'autoLightThemeIdentifier',
  AutoDarkThemeIdentifier = 'autoDarkThemeIdentifier',
  NoteAddToParentFolders = 'noteAddToParentFolders',
  NewNoteTitleFormat = 'newNoteTitleFormat',
  CustomNoteTitleFormat = 'customNoteTitleFormat',
  UpdateSavingStatusIndicator = 'updateSavingStatusIndicator',
  DefaultEditorIdentifier = 'defaultEditorIdentifier',
  MomentsDefaultTagUuid = 'momentsDefaultTagUuid',
  ClipperDefaultTagUuid = 'clipperDefaultTagUuid',
  SystemViewPreferences = 'systemViewPreferences',
  SuperNoteExportFormat = 'superNoteExportFormat',
  SuperNoteExportEmbedBehavior = 'superNoteExportEmbedBehavior',
  SuperNoteExportUseMDFrontmatter = 'superNoteExportUseMDFrontmatter',
  SuperNoteExportPDFPageSize = 'superNoteExportPDFPageSize',
  AuthenticatorNames = 'authenticatorNames',
  PaneGesturesEnabled = 'paneGesturesEnabled',
  ComponentPreferences = 'componentPreferences',
  ActiveThemes = 'activeThemes',
  ActiveComponents = 'activeComponents',
  AlwaysShowSuperToolbar = 'alwaysShowSuperToolbar',
  AddImportsToTag = 'addImportsToTag',
  AlwaysCreateNewTagForImports = 'alwaysCreateNewTagForImports',
  ExistingTagForImports = 'existingTagForImports',
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
  [PrefKey.UseTranslucentUI]: boolean
  [PrefKey.AutoLightThemeIdentifier]: string
  [PrefKey.AutoDarkThemeIdentifier]: string
  [PrefKey.NoteAddToParentFolders]: boolean
  [PrefKey.NewNoteTitleFormat]: NewNoteTitleFormat
  [PrefKey.CustomNoteTitleFormat]: string
  [PrefKey.EditorLineHeight]: EditorLineHeight
  [PrefKey.EditorLineWidth]: EditorLineWidth
  [PrefKey.EditorFontSize]: EditorFontSize
  [PrefKey.UpdateSavingStatusIndicator]: boolean
  [PrefKey.DefaultEditorIdentifier]: string
  [PrefKey.MomentsDefaultTagUuid]: string | undefined
  [PrefKey.ClipperDefaultTagUuid]: string | undefined
  [PrefKey.SystemViewPreferences]: Partial<Record<SystemViewId, TagPreferences>>
  [PrefKey.SuperNoteExportFormat]: 'json' | 'md' | 'html' | 'pdf'
  [PrefKey.SuperNoteExportEmbedBehavior]: 'reference' | 'inline' | 'separate'
  [PrefKey.SuperNoteExportUseMDFrontmatter]: boolean
  [PrefKey.SuperNoteExportPDFPageSize]: 'A3' | 'A4' | 'LETTER' | 'LEGAL' | 'TABLOID'
  [PrefKey.AuthenticatorNames]: string
  [PrefKey.PaneGesturesEnabled]: boolean
  [PrefKey.ComponentPreferences]: AllComponentPreferences
  [PrefKey.ActiveThemes]: string[]
  [PrefKey.ActiveComponents]: string[]
  [PrefKey.AlwaysShowSuperToolbar]: boolean
  [PrefKey.AddImportsToTag]: boolean
  [PrefKey.AlwaysCreateNewTagForImports]: boolean
  [PrefKey.ExistingTagForImports]: string | undefined
}
