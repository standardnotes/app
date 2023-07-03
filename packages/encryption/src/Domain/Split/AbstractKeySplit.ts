import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  KeySystemRootKeyInterface,
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemItemsKeyInterface,
} from '@standardnotes/models'

export interface AbstractKeySplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  usesRootKey?: {
    items: T[]
    key: RootKeyInterface
  }
  usesKeySystemRootKey?: {
    items: T[]
    key: KeySystemRootKeyInterface
  }
  usesItemsKey?: {
    items: T[]
    key: ItemsKeyInterface | KeySystemItemsKeyInterface
  }
  usesRootKeyWithKeyLookup?: {
    items: T[]
  }
  usesKeySystemRootKeyWithKeyLookup?: {
    items: T[]
  }
  usesItemsKeyWithKeyLookup?: {
    items: T[]
  }
}
