import { DecryptedItemMutator } from '../../Abstract/Item'
import { VaultKeyContent, VaultKeyContentSpecialized } from './VaultKeyContent'
import { Copy } from '@standardnotes/utils'

export class VaultKeyMutator extends DecryptedItemMutator<VaultKeyContent> {
  set content(content: VaultKeyContentSpecialized) {
    this.mutableContent = {
      ...this.mutableContent,
      ...Copy(content),
    }
  }

  set vaultName(vaultName: string) {
    this.mutableContent.vaultName = vaultName
  }

  set vaultDescription(vaultDescription: string | undefined) {
    this.mutableContent.vaultDescription = vaultDescription
  }
}
