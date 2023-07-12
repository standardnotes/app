import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface TagToParentTagReference extends AnonymousReference {
  content_type: string
  reference_type: ContentReferenceType.TagToParentTag
}
