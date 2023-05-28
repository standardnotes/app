import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  VaultKeyInterface,
  ItemsKeyInterface,
  RootKeyInterface,
  VaultItemsKeyInterface,
} from '@standardnotes/models'

export interface AbstractKeySplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  usesRootKey?: {
    items: T[]
    key: RootKeyInterface
  }
  usesVaultKey?: {
    items: T[]
    key: VaultKeyInterface
  }
  usesItemsKey?: {
    items: T[]
    key: ItemsKeyInterface | VaultItemsKeyInterface
  }
  usesRootKeyWithKeyLookup?: {
    items: T[]
  }
  usesVaultKeyWithKeyLookup?: {
    items: T[]
  }
  usesItemsKeyWithKeyLookup?: {
    items: T[]
  }
}
