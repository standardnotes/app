import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { ConflictStrategy, DecryptedItem } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { KeySystemRootKeyContent } from './KeySystemRootKeyContent'
import { KeySystemRootKeyInterface } from './KeySystemRootKeyInterface'
import { KeySystemIdentifier } from './KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'

export function isKeySystemRootKey(x: { content_type: ContentType }): x is KeySystemRootKey {
  return x.content_type === ContentType.KeySystemRootKey
}

export class KeySystemRootKey extends DecryptedItem<KeySystemRootKeyContent> implements KeySystemRootKeyInterface {
  keyParams: KeySystemRootKeyParamsInterface
  systemIdentifier: KeySystemIdentifier

  systemName: string
  systemDescription?: string

  key: string
  keyVersion: ProtocolVersion
  itemsKeyAnchor: string

  constructor(payload: DecryptedPayloadInterface<KeySystemRootKeyContent>) {
    super(payload)

    this.keyParams = payload.content.keyParams
    this.systemIdentifier = payload.content.systemIdentifier
    this.systemName = payload.content.systemName
    this.systemDescription = payload.content.systemDescription

    this.key = payload.content.key
    this.keyVersion = payload.content.keyVersion
    this.itemsKeyAnchor = payload.content.itemsKeyAnchor
  }

  override strategyWhenConflictingWithItem(
    item: KeySystemRootKey,
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
