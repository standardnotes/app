import { DecryptedItemMutator } from '../../Abstract/Item'
import { VaultKeyCopyContent } from './VaultKeyCopyContent'

export class VaultKeyMutator extends DecryptedItemMutator<VaultKeyCopyContent> {
  set vaultName(vaultName: string) {
    this.mutableContent.vaultName = vaultName
  }

  set vaultDescription(vaultDescription: string | undefined) {
    this.mutableContent.vaultDescription = vaultDescription
  }
}
