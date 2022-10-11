import { ContentType } from '@standardnotes/common'
import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface NoteToNoteReference extends AnonymousReference {
  content_type: ContentType.Note
  reference_type: ContentReferenceType.NoteToNote
}
