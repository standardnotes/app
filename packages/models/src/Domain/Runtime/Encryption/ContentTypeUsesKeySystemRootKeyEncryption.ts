import { ContentType } from '@standardnotes/domain-core'

export function ContentTypeUsesKeySystemRootKeyEncryption(contentType: string): boolean {
  return contentType === ContentType.TYPES.KeySystemItemsKey
}
