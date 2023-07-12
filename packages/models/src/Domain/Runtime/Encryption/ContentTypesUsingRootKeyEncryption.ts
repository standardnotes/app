import { ContentType } from '@standardnotes/domain-core'

export function ContentTypesUsingRootKeyEncryption(): string[] {
  return [
    ContentType.TYPES.RootKey,
    ContentType.TYPES.ItemsKey,
    ContentType.TYPES.EncryptedStorage,
    ContentType.TYPES.TrustedContact,
    ContentType.TYPES.KeySystemRootKey,
  ]
}
