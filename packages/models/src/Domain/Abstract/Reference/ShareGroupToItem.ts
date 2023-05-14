import { ContentType } from '@standardnotes/common'
import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface ShareGroupToItemReference extends AnonymousReference {
  content_type: ContentType
  reference_type: ContentReferenceType.ShareGroupToItem
}
