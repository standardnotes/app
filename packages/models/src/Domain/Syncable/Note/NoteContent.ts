import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export interface NoteContentSpecialized {
  title: string
  text: string
  hidePreview?: boolean
  preview_plain?: string
  preview_html?: string
  spellcheck?: boolean
  noteType?: NoteType
  editorIdentifier?: FeatureIdentifier | string
  authorizedForListed?: boolean
}

export type NoteContent = NoteContentSpecialized & ItemContent
