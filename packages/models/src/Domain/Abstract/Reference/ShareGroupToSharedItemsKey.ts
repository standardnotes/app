import { ContentType } from '@standardnotes/common'
import { AnonymousReference } from './AnonymousReference'
import { ContentReferenceType } from './ContenteReferenceType'

export interface ShareGroupToSharedItemsKeyReference extends AnonymousReference {
  content_type: ContentType.SharedItemsKey
  reference_type: ContentReferenceType.ShareGroupToSharedItemsKey
}
