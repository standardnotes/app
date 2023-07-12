import { DecryptedItemMutator, ItemsKeyContent, RegisterItemClass } from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'
import { SNItemsKey } from './ItemsKey'
import { ItemsKeyMutator } from './ItemsKeyMutator'

RegisterItemClass(
  ContentType.TYPES.ItemsKey,
  SNItemsKey,
  ItemsKeyMutator as unknown as DecryptedItemMutator<ItemsKeyContent>,
)
