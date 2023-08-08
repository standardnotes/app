import { KeySystemIdentifier } from '../KeySystemRootKey/KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { KeySystemPasswordType } from '../../Local/KeyParams/KeySystemPasswordType'
import { KeySystemRootKeyStorageMode } from '../KeySystemRootKey/KeySystemRootKeyStorageMode'
import { VaultListingSharingInfo } from './VaultListingSharingInfo'
import { VaultListingContent } from './VaultListingContent'
import { DecryptedItemInterface } from '../../Abstract/Item'
import { EmojiString, IconType } from '../../Utilities/Icon/IconType'

export interface VaultListingInterface extends DecryptedItemInterface<VaultListingContent> {
  systemIdentifier: KeySystemIdentifier

  rootKeyParams: KeySystemRootKeyParamsInterface
  keyStorageMode: KeySystemRootKeyStorageMode

  name: string
  description?: string
  iconString: IconType | EmojiString

  sharing?: VaultListingSharingInfo

  get keyPasswordType(): KeySystemPasswordType
  isSharedVaultListing(): this is SharedVaultListingInterface

  get key_system_identifier(): undefined
  get shared_vault_uuid(): undefined
}

export interface SharedVaultListingInterface extends VaultListingInterface {
  sharing: VaultListingSharingInfo
}
