import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'
import { KeySystemIdentifier } from '../KeySystemRootKey/KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { KeySystemRootKeyStorageMode } from '../KeySystemRootKey/KeySystemRootKeyStorageMode'
import { VaultListingSharingInfo } from './VaultListingSharingInfo'

export interface VaultListingContentSpecialized extends SpecializedContent {
  systemIdentifier: KeySystemIdentifier

  rootKeyParams: KeySystemRootKeyParamsInterface
  keyStorageMode: KeySystemRootKeyStorageMode

  name: string
  description?: string

  sharing?: VaultListingSharingInfo
}

export type VaultListingContent = VaultListingContentSpecialized & ItemContent
