import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  ItemsKeyInterface,
  RootKeyInterface,
  ShareGroup,
} from '@standardnotes/models'

export interface AbstractKeySplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  usesRootKey?: {
    items: T[]
    key: RootKeyInterface
  }
  usesGroupKey?: {
    items: T[]
    key: ShareGroup
  }
  usesItemsKey?: {
    items: T[]
    key: ItemsKeyInterface
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
