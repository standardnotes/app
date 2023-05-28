import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { ConflictStrategy, DecryptedItem } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { VaultKeyContent } from './VaultKeyContent'
import { VaultKeyInterface } from './VaultKeyInterface'

export function isVaultKey(x: { content_type: ContentType }): x is VaultKey {
  return x.content_type === ContentType.VaultKey
}

export class VaultKey extends DecryptedItem<VaultKeyContent> implements VaultKeyInterface {
  vaultUuid: string
  vaultName?: string
  vaultDescription?: string
  vaultKey: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  constructor(payload: DecryptedPayloadInterface<VaultKeyContent>) {
    super(payload)

    this.vaultUuid = payload.content.vaultUuid
    this.vaultName = payload.content.vaultName
    this.vaultDescription = payload.content.vaultDescription
    this.vaultKey = payload.content.vaultKey
    this.keyTimestamp = payload.content.keyTimestamp
    this.keyVersion = payload.content.keyVersion
  }

  override strategyWhenConflictingWithItem(
    item: VaultKey,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    const baseKeyTimestamp = this.keyTimestamp
    const incomingKeyTimestamp = item.keyTimestamp
    return incomingKeyTimestamp > baseKeyTimestamp ? ConflictStrategy.KeepApply : ConflictStrategy.KeepBase
  }

  get itemsKey(): string {
    return this.vaultKey
  }
}
