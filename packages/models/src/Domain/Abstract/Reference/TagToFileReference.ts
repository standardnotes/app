import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface TagToFileReference extends AnonymousReference {
  content_type: string
  reference_type: ContentReferenceType.TagToFile
}
