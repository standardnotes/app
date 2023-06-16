import { DecryptedItemMutator } from '../../Abstract/Item'
import { VaultListingContent } from './VaultListingContent'
import { VaultListingSharingInfo } from './VaultListingSharingInfo'

export class VaultListingMutator extends DecryptedItemMutator<VaultListingContent> {
  set name(name: string) {
    this.mutableContent.name = name
  }

  set description(description: string | undefined) {
    this.mutableContent.description = description
  }

  set sharing(sharing: VaultListingSharingInfo | undefined) {
    this.mutableContent.sharing = sharing
  }
}
