import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface FileToFileReference extends AnonymousReference {
  content_type: string
  reference_type: ContentReferenceType.FileToFile
}
