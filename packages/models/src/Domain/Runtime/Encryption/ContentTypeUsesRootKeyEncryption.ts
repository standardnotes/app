import { ContentTypesUsingRootKeyEncryption } from './ContentTypesUsingRootKeyEncryption'

export function ContentTypeUsesRootKeyEncryption(contentType: string): boolean {
  return ContentTypesUsingRootKeyEncryption().includes(contentType)
}
