import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'
import { KeySystemIdentifier } from '../KeySystemRootKey/KeySystemIdentifier'
import {
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
} from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { KeySystemRootKeyStorageType } from '../KeySystemRootKey/KeySystemRootKeyStorageType'
import { VaultListingSharingInfo } from './VaultListingSharingInfo'

export interface VaultListingContentSpecialized extends SpecializedContent {
  systemIdentifier: KeySystemIdentifier

  rootKeyPasswordType: KeySystemRootKeyPasswordType
  rootKeyParams: KeySystemRootKeyParamsInterface
  rootKeyStorage: KeySystemRootKeyStorageType

  name: string
  description?: string

  sharing?: VaultListingSharingInfo
}

export type VaultListingContent = VaultListingContentSpecialized & ItemContent
