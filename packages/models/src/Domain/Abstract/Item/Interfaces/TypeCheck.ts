import { EncryptedItemInterface } from './EncryptedItem'
import { DeletedItemInterface } from './DeletedItem'
import { ItemInterface } from './ItemInterface'
import { DecryptedItemInterface } from './DecryptedItem'
import { isDecryptedPayload, isDeletedPayload, isEncryptedPayload } from '../../Payload/Interfaces/TypeCheck'

export function isDecryptedItem(item: ItemInterface): item is DecryptedItemInterface {
  return 'payload' in item && isDecryptedPayload(item.payload)
}

export function isEncryptedItem(item: ItemInterface): item is EncryptedItemInterface {
  return isEncryptedPayload(item.payload)
}

export function isNotEncryptedItem(
  item: DecryptedItemInterface | DeletedItemInterface | EncryptedItemInterface,
): item is DecryptedItemInterface | DeletedItemInterface {
  return !isEncryptedItem(item)
}

export function isDeletedItem(item: ItemInterface): item is DeletedItemInterface {
  return isDeletedPayload(item.payload)
}

export function isDecryptedOrDeletedItem(item: ItemInterface): item is DecryptedItemInterface | DeletedItemInterface {
  return isDecryptedItem(item) || isDeletedItem(item)
}

export function isEncryptedErroredItem(item: ItemInterface): boolean {
  return isEncryptedItem(item) && item.errorDecrypting === true
}
