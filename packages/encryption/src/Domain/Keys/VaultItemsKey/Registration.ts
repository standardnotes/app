import { ContentType } from '@standardnotes/common'
import { DecryptedItemMutator, VaultItemsKeyContent, RegisterItemClass } from '@standardnotes/models'
import { VaultItemsKey } from './VaultItemsKey'
import { VaultItemsKeyMutator } from './VaultItemsKeyMutator'

RegisterItemClass(
  ContentType.VaultItemsKey,
  VaultItemsKey,
  VaultItemsKeyMutator as unknown as DecryptedItemMutator<VaultItemsKeyContent>,
)
