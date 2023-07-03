import { ContentType } from '@standardnotes/common'
import { ContentTypesUsingRootKeyEncryption } from './ContentTypesUsingRootKeyEncryption'

export function ContentTypeUsesRootKeyEncryption(contentType: ContentType): boolean {
  return ContentTypesUsingRootKeyEncryption().includes(contentType)
}
