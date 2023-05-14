import { DecryptedItemMutator, SharedItemsKeyContent, ItemsKeyMutatorInterface } from '@standardnotes/models'

export class SharedItemsKeyMutator
  extends DecryptedItemMutator<SharedItemsKeyContent>
  implements ItemsKeyMutatorInterface {}
