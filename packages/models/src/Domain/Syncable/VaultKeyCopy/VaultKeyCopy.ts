import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { ConflictStrategy, DecryptedItem } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { VaultKeyCopyContent } from './VaultKeyCopyContent'
import { VaultKeyCopyInterface } from './VaultKeyCopyInterface'
import { KeySystemIdentifier } from '../../Utilities/Vault/KeySystemIdentifier'

export function isVaultKey(x: { content_type: ContentType }): x is VaultKeyCopy {
  return x.content_type === ContentType.VaultKeyCopy
}

export class VaultKeyCopy extends DecryptedItem<VaultKeyCopyContent> implements VaultKeyCopyInterface {
  keySystemIdentifier: KeySystemIdentifier

  vaultName: string
  vaultDescription?: string

  key: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  constructor(payload: DecryptedPayloadInterface<VaultKeyCopyContent>) {
    super(payload)

    this.keySystemIdentifier = payload.content.keySystemIdentifier

    this.vaultName = payload.content.vaultName
    this.vaultDescription = payload.content.vaultDescription

    this.key = payload.content.key
    this.keyTimestamp = payload.content.keyTimestamp
    this.keyVersion = payload.content.keyVersion
  }

  override strategyWhenConflictingWithItem(
    item: VaultKeyCopy,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    const baseKeyTimestamp = this.keyTimestamp
    const incomingKeyTimestamp = item.keyTimestamp

    return incomingKeyTimestamp > baseKeyTimestamp ? ConflictStrategy.KeepApply : ConflictStrategy.KeepBase
  }

  get itemsKey(): string {
    return this.key
  }

  override get key_system_identifier(): undefined {
    return undefined
  }
}
