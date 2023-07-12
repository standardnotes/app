import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface FileToNoteReference extends AnonymousReference {
  content_type: string
  reference_type: ContentReferenceType.FileToNote
}
