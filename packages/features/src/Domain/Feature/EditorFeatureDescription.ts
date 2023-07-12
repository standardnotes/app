import { NoteType } from '../Component/NoteType'
import { BaseFeatureDescription } from './BaseFeatureDescription'

export type EditorFeatureDescription = BaseFeatureDescription & {
  file_type: 'txt' | 'html' | 'md' | 'json'
  /** Whether an editor is interchangable with another editor that has the same file_type */
  interchangeable: boolean
  note_type: NoteType
  spellcheckControl: boolean
}
