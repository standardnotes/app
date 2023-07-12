import { ContentReferenceType } from './ContenteReferenceType'

export interface AnonymousReference {
  uuid: string
  content_type: string
  reference_type: ContentReferenceType
}
