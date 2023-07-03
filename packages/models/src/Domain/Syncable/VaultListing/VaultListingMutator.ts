import { DecryptedItemMutator } from '../../Abstract/Item'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { KeySystemRootKeyStorageMode } from '../KeySystemRootKey/KeySystemRootKeyStorageMode'
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

  set rootKeyParams(rootKeyParams: KeySystemRootKeyParamsInterface) {
    this.mutableContent.rootKeyParams = rootKeyParams
  }

  set keyStorageMode(keyStorageMode: KeySystemRootKeyStorageMode) {
    this.mutableContent.keyStorageMode = keyStorageMode
  }
}
