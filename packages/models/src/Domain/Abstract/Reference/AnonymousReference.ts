import { ContentType } from '@standardnotes/common'
import { ContenteReferenceType } from './ContenteReferenceType'

export interface AnonymousReference {
  uuid: string
  content_type: ContentType
  reference_type: ContenteReferenceType
}
