import { ContentType } from '@standardnotes/common'
import { AnonymousReference } from './AnonymousReference'
import { ContenteReferenceType } from './ContenteReferenceType'

export interface TagToParentTagReference extends AnonymousReference {
  content_type: ContentType.Tag
  reference_type: ContenteReferenceType.TagToParentTag
}
