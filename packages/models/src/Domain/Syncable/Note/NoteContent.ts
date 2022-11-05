import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { NoteBlocks } from './NoteBlocks'

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
  blocksItem?: NoteBlocks
}

export type NoteContent = NoteContentSpecialized & ItemContent
