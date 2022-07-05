import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  ItemsKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'

export interface AbstractKeySplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  usesRootKey?: {
    items: T[]
    key: RootKeyInterface
  }
  usesItemsKey?: {
    items: T[]
    key: ItemsKeyInterface
  }
  usesRootKeyWithKeyLookup?: {
    items: T[]
  }
  usesItemsKeyWithKeyLookup?: {
    items: T[]
  }
}
