import { DecryptedItemMutator, KeySystemItemsKeyContent, RegisterItemClass } from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'

import { KeySystemItemsKey } from './KeySystemItemsKey'
import { KeySystemItemsKeyMutator } from './KeySystemItemsKeyMutator'

RegisterItemClass(
  ContentType.TYPES.KeySystemItemsKey,
  KeySystemItemsKey,
  KeySystemItemsKeyMutator as unknown as DecryptedItemMutator<KeySystemItemsKeyContent>,
)
