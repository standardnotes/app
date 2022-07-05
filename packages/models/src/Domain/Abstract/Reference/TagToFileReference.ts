import { ContentType } from '@standardnotes/common'
import { AnonymousReference } from './AnonymousReference'
import { ContenteReferenceType } from './ContenteReferenceType'

export interface TagToFileReference extends AnonymousReference {
  content_type: ContentType.File
  reference_type: ContenteReferenceType.TagToFile
}
