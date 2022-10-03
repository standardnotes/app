import { ContentType } from '@standardnotes/common'
import { ContentReferenceType } from './ContenteReferenceType'

export interface AnonymousReference {
  uuid: string
  content_type: ContentType
  reference_type: ContentReferenceType
}
