import { ContentType } from '@standardnotes/common'
import { DecryptedItemMutator, ItemsKeyContent, RegisterItemClass } from '@standardnotes/models'
import { SNItemsKey } from './ItemsKey'
import { ItemsKeyMutator } from './ItemsKeyMutator'

RegisterItemClass(ContentType.ItemsKey, SNItemsKey, ItemsKeyMutator as unknown as DecryptedItemMutator<ItemsKeyContent>)
