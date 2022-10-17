import { ItemContent } from '../../Abstract/Content/ItemContent'

export interface NoteContentSpecialized {
  title: string
  text: string
  mobilePrefersPlainEditor?: boolean
  hidePreview?: boolean
  preview_plain?: string
  preview_html?: string
  spellcheck?: boolean
  starred?: boolean
}

export type NoteContent = NoteContentSpecialized & ItemContent
