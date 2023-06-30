import { ContentType } from '@standardnotes/common'
import { DecryptedItemMutator, KeySystemItemsKeyContent, RegisterItemClass } from '@standardnotes/models'
import { KeySystemItemsKey } from './KeySystemItemsKey'
import { KeySystemItemsKeyMutator } from './KeySystemItemsKeyMutator'

RegisterItemClass(
  ContentType.KeySystemItemsKey,
  KeySystemItemsKey,
  KeySystemItemsKeyMutator as unknown as DecryptedItemMutator<KeySystemItemsKeyContent>,
)
