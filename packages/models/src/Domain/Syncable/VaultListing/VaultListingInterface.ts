import { KeySystemIdentifier } from '../KeySystemRootKey/KeySystemIdentifier'
import {
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
} from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { KeySystemRootKeyStorageType } from '../KeySystemRootKey/KeySystemRootKeyStorageType'
import { VaultListingSharingInfo } from './VaultListingSharingInfo'
import { VaultListingContent } from './VaultListingContent'
import { DecryptedItemInterface } from '../../Abstract/Item'

export interface VaultListingInterface extends DecryptedItemInterface<VaultListingContent> {
  systemIdentifier: KeySystemIdentifier

  rootKeyPasswordType: KeySystemRootKeyPasswordType
  rootKeyParams: KeySystemRootKeyParamsInterface
  rootKeyStorage: KeySystemRootKeyStorageType

  name: string
  description?: string

  sharing?: VaultListingSharingInfo

  isSharedVaultListing(): this is SharedVaultListingInterface

  get key_system_identifier(): undefined
  get shared_vault_uuid(): undefined
}

export interface SharedVaultListingInterface extends VaultListingInterface {
  sharing: VaultListingSharingInfo
}
