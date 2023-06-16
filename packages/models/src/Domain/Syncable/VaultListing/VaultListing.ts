import { ConflictStrategy, DecryptedItem } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import {
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
} from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { SharedVaultListingInterface, VaultListingInterface } from './VaultListingInterface'
import { VaultListingContent } from './VaultListingContent'
import { KeySystemRootKeyStorageType } from '../KeySystemRootKey/KeySystemRootKeyStorageType'
import { VaultListingSharingInfo } from './VaultListingSharingInfo'
import { KeySystemIdentifier } from '../KeySystemRootKey/KeySystemIdentifier'

export class VaultListing extends DecryptedItem<VaultListingContent> implements VaultListingInterface {
  systemIdentifier: KeySystemIdentifier

  rootKeyPasswordType: KeySystemRootKeyPasswordType
  rootKeyParams: KeySystemRootKeyParamsInterface
  rootKeyStorage: KeySystemRootKeyStorageType

  name: string
  description?: string

  sharing?: VaultListingSharingInfo

  constructor(payload: DecryptedPayloadInterface<VaultListingContent>) {
    super(payload)

    this.systemIdentifier = payload.content.systemIdentifier

    this.rootKeyPasswordType = payload.content.rootKeyPasswordType
    this.rootKeyParams = payload.content.rootKeyParams
    this.rootKeyStorage = payload.content.rootKeyStorage

    this.name = payload.content.name
    this.description = payload.content.description

    this.sharing = payload.content.sharing
  }

  override strategyWhenConflictingWithItem(
    item: VaultListing,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    const baseKeyTimestamp = this.rootKeyParams.creationTimestamp
    const incomingKeyTimestamp = item.rootKeyParams.creationTimestamp

    return incomingKeyTimestamp > baseKeyTimestamp ? ConflictStrategy.KeepApply : ConflictStrategy.KeepBase
  }

  isSharedVaultListing(): this is SharedVaultListingInterface {
    return this.sharing != undefined
  }

  override get key_system_identifier(): undefined {
    return undefined
  }

  override get shared_vault_uuid(): undefined {
    return undefined
  }
}
