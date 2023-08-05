import { NativeFeatureIdentifier } from '@standardnotes/features'
import { CollectionSort } from '../../Runtime/Collection/CollectionSort'
import { EditorFontSize } from './EditorFontSize'
import { EditorLineHeight } from './EditorLineHeight'
import { EditorLineWidth } from './EditorLineWidth'
import { PrefKey, PrefValue } from './PrefKey'
import { NewNoteTitleFormat } from './NewNoteTitleFormat'

export const PrefDefaults = {
  [PrefKey.TagsPanelWidth]: 220,
  [PrefKey.NotesPanelWidth]: 350,
  [PrefKey.EditorWidth]: null,
  [PrefKey.EditorLeft]: null,
  [PrefKey.EditorMonospaceEnabled]: false,
  [PrefKey.EditorSpellcheck]: true,
  [PrefKey.EditorResizersEnabled]: false,
  [PrefKey.EditorLineHeight]: EditorLineHeight.Normal,
  [PrefKey.EditorLineWidth]: EditorLineWidth.FullWidth,
  [PrefKey.EditorFontSize]: EditorFontSize.Normal,
  [PrefKey.SortNotesBy]: CollectionSort.CreatedAt,
  [PrefKey.SortNotesReverse]: false,
  [PrefKey.NotesShowArchived]: false,
  [PrefKey.NotesShowTrashed]: false,
  [PrefKey.NotesHidePinned]: false,
  [PrefKey.NotesHideProtected]: false,
  [PrefKey.NotesHideNotePreview]: false,
  [PrefKey.NotesHideDate]: false,
  [PrefKey.NotesHideTags]: false,
  [PrefKey.NotesHideEditorIcon]: false,
  [PrefKey.UseSystemColorScheme]: false,
  [PrefKey.UseTranslucentUI]: true,
  [PrefKey.AutoLightThemeIdentifier]: 'Default',
  [PrefKey.AutoDarkThemeIdentifier]: NativeFeatureIdentifier.TYPES.DarkTheme,
  [PrefKey.NoteAddToParentFolders]: true,
  [PrefKey.NewNoteTitleFormat]: NewNoteTitleFormat.CurrentDateAndTime,
  [PrefKey.CustomNoteTitleFormat]: 'YYYY-MM-DD [at] hh:mm A',
  [PrefKey.UpdateSavingStatusIndicator]: true,
  [PrefKey.PaneGesturesEnabled]: true,
  [PrefKey.MomentsDefaultTagUuid]: undefined,
  [PrefKey.ClipperDefaultTagUuid]: undefined,
  [PrefKey.DefaultEditorIdentifier]: NativeFeatureIdentifier.TYPES.PlainEditor,
  [PrefKey.SuperNoteExportFormat]: 'json',
  [PrefKey.SystemViewPreferences]: {},
  [PrefKey.AuthenticatorNames]: '',
  [PrefKey.ComponentPreferences]: {},
  [PrefKey.ActiveThemes]: [],
  [PrefKey.ActiveComponents]: [],
} satisfies {
  [key in PrefKey]: PrefValue[key]
}
