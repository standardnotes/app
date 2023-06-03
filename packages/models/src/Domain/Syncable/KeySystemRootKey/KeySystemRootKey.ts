import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { ConflictStrategy, DecryptedItem } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { KeySystemRootKeyContent } from './KeySystemRootKeyContent'
import { KeySystemRootKeyInterface } from './KeySystemRootKeyInterface'
import { KeySystemIdentifier } from './KeySystemIdentifier'

export function isKeySystemRootKey(x: { content_type: ContentType }): x is KeySystemRootKey {
  return x.content_type === ContentType.KeySystemRootKey
}

export class KeySystemRootKey extends DecryptedItem<KeySystemRootKeyContent> implements KeySystemRootKeyInterface {
  systemIdentifier: KeySystemIdentifier

  systemName: string
  systemDescription?: string

  key: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  constructor(payload: DecryptedPayloadInterface<KeySystemRootKeyContent>) {
    super(payload)

    this.systemIdentifier = payload.content.systemIdentifier
    this.systemName = payload.content.systemName
    this.systemDescription = payload.content.systemDescription

    this.key = payload.content.key
    this.keyTimestamp = payload.content.keyTimestamp
    this.keyVersion = payload.content.keyVersion
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
