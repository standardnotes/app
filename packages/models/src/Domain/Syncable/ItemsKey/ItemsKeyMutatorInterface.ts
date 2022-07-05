import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'

export interface ItemsKeyMutatorInterface extends DecryptedItemMutator {
  set isDefault(isDefault: boolean)
}
