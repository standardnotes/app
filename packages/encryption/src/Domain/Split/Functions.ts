import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  ContentTypeUsesKeySystemRootKeyEncryption,
  ContentTypeUsesRootKeyEncryption,
} from '@standardnotes/models'
import { EncryptionTypeSplit } from './EncryptionTypeSplit'

export function SplitPayloadsByEncryptionType<T extends EncryptedPayloadInterface | DecryptedPayloadInterface>(
  payloads: T[],
): EncryptionTypeSplit<T> {
  const usesRootKey: T[] = []
  const usesItemsKey: T[] = []
  const usesKeySystemRootKey: T[] = []

  for (const item of payloads) {
    if (ContentTypeUsesRootKeyEncryption(item.content_type)) {
      usesRootKey.push(item)
    } else if (ContentTypeUsesKeySystemRootKeyEncryption(item.content_type)) {
      usesKeySystemRootKey.push(item)
    } else {
      usesItemsKey.push(item)
    }
  }

  return {
    rootKeyEncryption: usesRootKey.length > 0 ? usesRootKey : undefined,
    itemsKeyEncryption: usesItemsKey.length > 0 ? usesItemsKey : undefined,
    keySystemRootKeyEncryption: usesKeySystemRootKey.length > 0 ? usesKeySystemRootKey : undefined,
  }
}
