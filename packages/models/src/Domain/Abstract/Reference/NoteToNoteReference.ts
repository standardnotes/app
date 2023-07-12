import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface NoteToNoteReference extends AnonymousReference {
  content_type: string
  reference_type: ContentReferenceType.NoteToNote
}
