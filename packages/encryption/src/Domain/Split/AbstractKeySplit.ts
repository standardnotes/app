import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  GroupKeyInterface,
  ItemsKeyInterface,
  RootKeyInterface,
  SharedItemsKeyInterface,
} from '@standardnotes/models'

export interface AbstractKeySplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  usesRootKey?: {
    items: T[]
    key: RootKeyInterface
  }
  usesGroupKey?: {
    items: T[]
    key: GroupKeyInterface
  }
  usesItemsKey?: {
    items: T[]
    key: ItemsKeyInterface | SharedItemsKeyInterface
  }
  usesRootKeyWithKeyLookup?: {
    items: T[]
  }
  usesGroupKeyWithKeyLookup?: {
    items: T[]
  }
  usesItemsKeyWithKeyLookup?: {
    items: T[]
  }
}
