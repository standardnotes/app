import { Uuid } from '@standardnotes/common'

export interface EncryptedItemKeyShareInterface {
  uuid: Uuid
  senderPublicKey: string
  encryptedKey: string
  type: 'item'
  itemUuid: Uuid
}

export interface DecryptedItemKeyShareInterface {
  uuid: Uuid
  contentKey: string
  type: 'item'
  itemUuid: Uuid
}
