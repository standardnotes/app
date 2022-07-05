import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { PrefKey, PrefValue } from './PrefKey'

export class UserPrefsMutator extends DecryptedItemMutator {
  setPref<K extends PrefKey>(key: K, value: PrefValue[K]): void {
    this.setAppDataItem(key, value)
  }
}
