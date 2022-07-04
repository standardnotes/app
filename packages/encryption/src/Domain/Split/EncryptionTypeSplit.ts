import { DecryptedPayloadInterface, EncryptedPayloadInterface } from '@standardnotes/models'
import { ItemContentTypeUsesRootKeyEncryption } from '../Keys/RootKey/Functions'

export interface EncryptionTypeSplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  rootKeyEncryption?: T[]
  itemsKeyEncryption?: T[]
}

export function SplitPayloadsByEncryptionType<T extends EncryptedPayloadInterface | DecryptedPayloadInterface>(
  payloads: T[],
): EncryptionTypeSplit<T> {
  const usesRootKey: T[] = []
  const usesItemsKey: T[] = []

  for (const item of payloads) {
    if (ItemContentTypeUsesRootKeyEncryption(item.content_type)) {
      usesRootKey.push(item)
    } else {
      usesItemsKey.push(item)
    }
  }

  return {
    rootKeyEncryption: usesRootKey.length > 0 ? usesRootKey : undefined,
    itemsKeyEncryption: usesItemsKey.length > 0 ? usesItemsKey : undefined,
  }
}
