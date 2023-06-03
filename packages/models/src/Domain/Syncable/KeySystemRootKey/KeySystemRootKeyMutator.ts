import { DecryptedItemMutator } from '../../Abstract/Item'
import { KeySystemRootKeyContent } from './KeySystemRootKeyContent'

export class KeySystemRootKeyMutator extends DecryptedItemMutator<KeySystemRootKeyContent> {
  set systemName(systemName: string) {
    this.mutableContent.systemName = systemName
  }

  set systemDescription(systemDescription: string | undefined) {
    this.mutableContent.systemDescription = systemDescription
  }
}
