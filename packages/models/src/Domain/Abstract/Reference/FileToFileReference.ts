import { ContentType } from '@standardnotes/common'
import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface FileToFileReference extends AnonymousReference {
  content_type: ContentType.File
  reference_type: ContentReferenceType.FileToFile
}
