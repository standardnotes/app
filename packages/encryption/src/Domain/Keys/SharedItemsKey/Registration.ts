import { ContentType } from '@standardnotes/common'
import { DecryptedItemMutator, SharedItemsKeyContent, RegisterItemClass } from '@standardnotes/models'
import { SharedItemsKey } from './SharedItemsKey'
import { SharedItemsKeyMutator } from './SharedItemsKeyMutator'

RegisterItemClass(
  ContentType.SharedItemsKey,
  SharedItemsKey,
  SharedItemsKeyMutator as unknown as DecryptedItemMutator<SharedItemsKeyContent>,
)
