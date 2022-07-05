import { DecryptedItemMutator, ItemsKeyContent, ItemsKeyMutatorInterface } from '@standardnotes/models'

export class ItemsKeyMutator extends DecryptedItemMutator<ItemsKeyContent> implements ItemsKeyMutatorInterface {
  set isDefault(isDefault: boolean) {
    this.mutableContent.isDefault = isDefault
  }
}
