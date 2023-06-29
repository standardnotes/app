import { ContentType } from '@standardnotes/common'

export function ContentTypeUsesKeySystemRootKeyEncryption(contentType: ContentType): boolean {
  return contentType === ContentType.KeySystemItemsKey
}
