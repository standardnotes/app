import { KeySystemIdentifier } from '../KeySystemRootKey/KeySystemIdentifier'
import {
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
} from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { KeySystemRootKeyStorageMode } from '../KeySystemRootKey/KeySystemRootKeyStorageMode'
import { VaultListingSharingInfo } from './VaultListingSharingInfo'
import { VaultListingContent } from './VaultListingContent'
import { DecryptedItemInterface } from '../../Abstract/Item'

export interface VaultListingInterface extends DecryptedItemInterface<VaultListingContent> {
  systemIdentifier: KeySystemIdentifier

  rootKeyParams: KeySystemRootKeyParamsInterface
  keyStorageMode: KeySystemRootKeyStorageMode

  name: string
  description?: string

  sharing?: VaultListingSharingInfo

  get keyPasswordType(): KeySystemRootKeyPasswordType
  isSharedVaultListing(): this is SharedVaultListingInterface

  get key_system_identifier(): undefined
  get shared_vault_uuid(): undefined
}

export interface SharedVaultListingInterface extends VaultListingInterface {
  sharing: VaultListingSharingInfo
}
