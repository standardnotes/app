import { ItemContent } from '../../Content/ItemContent'
import { DecryptedItemInterface } from './DecryptedItem'
import { DeletedItemInterface } from './DeletedItem'
import { EncryptedItemInterface } from './EncryptedItem'

export type AnyItemInterface<C extends ItemContent = ItemContent> =
  | EncryptedItemInterface
  | DecryptedItemInterface<C>
  | DeletedItemInterface
