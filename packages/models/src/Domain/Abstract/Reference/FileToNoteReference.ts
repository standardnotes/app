import { ContentType } from '@standardnotes/common'
import { AnonymousReference } from './AnonymousReference'
import { ContenteReferenceType } from './ContenteReferenceType'

export interface FileToNoteReference extends AnonymousReference {
  content_type: ContentType.Note
  reference_type: ContenteReferenceType.FileToNote
}
