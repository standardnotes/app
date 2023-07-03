import { ContentType } from '@standardnotes/common'

export function ContentTypesUsingRootKeyEncryption(): ContentType[] {
  return [
    ContentType.RootKey,
    ContentType.ItemsKey,
    ContentType.EncryptedStorage,
    ContentType.TrustedContact,
    ContentType.KeySystemRootKey,
  ]
}
