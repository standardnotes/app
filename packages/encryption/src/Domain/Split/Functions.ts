import { DecryptedPayloadInterface, EncryptedPayloadInterface } from '@standardnotes/models'
import { ItemContentTypeUsesVaultKeyEncryption, ItemContentTypeUsesRootKeyEncryption } from '../Keys/RootKey/Functions'
import { EncryptionTypeSplit } from './EncryptionTypeSplit'

export function SplitPayloadsByEncryptionType<T extends EncryptedPayloadInterface | DecryptedPayloadInterface>(
  payloads: T[],
): EncryptionTypeSplit<T> {
  const usesRootKey: T[] = []
  const usesItemsKey: T[] = []
  const usesVaultKey: T[] = []

  for (const item of payloads) {
    if (ItemContentTypeUsesRootKeyEncryption(item.content_type)) {
      usesRootKey.push(item)
    } else if (ItemContentTypeUsesVaultKeyEncryption(item.content_type)) {
      usesVaultKey.push(item)
    } else {
      usesItemsKey.push(item)
    }
  }

  return {
    rootKeyEncryption: usesRootKey.length > 0 ? usesRootKey : undefined,
    itemsKeyEncryption: usesItemsKey.length > 0 ? usesItemsKey : undefined,
    vaultKeyEncryption: usesVaultKey.length > 0 ? usesVaultKey : undefined,
  }
}
