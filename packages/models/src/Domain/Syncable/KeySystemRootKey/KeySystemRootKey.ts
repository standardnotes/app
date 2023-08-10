import { ConflictStrategy, DecryptedItem } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { KeySystemRootKeyContent } from './KeySystemRootKeyContent'
import { KeySystemRootKeyInterface } from './KeySystemRootKeyInterface'
import { KeySystemIdentifier } from './KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { ContentType } from '@standardnotes/domain-core'
import { ProtocolVersion } from '../../Local/Protocol/ProtocolVersion'

export function isKeySystemRootKey(x: { content_type: string }): x is KeySystemRootKey {
  return x.content_type === ContentType.TYPES.KeySystemRootKey
}

export class KeySystemRootKey extends DecryptedItem<KeySystemRootKeyContent> implements KeySystemRootKeyInterface {
  keyParams: KeySystemRootKeyParamsInterface
  systemIdentifier: KeySystemIdentifier

  key: string
  keyVersion: ProtocolVersion
  token: string

  constructor(payload: DecryptedPayloadInterface<KeySystemRootKeyContent>) {
    super(payload)

    this.keyParams = payload.content.keyParams
    this.systemIdentifier = payload.content.systemIdentifier

    this.key = payload.content.key
    this.keyVersion = payload.content.keyVersion
    this.token = payload.content.token
  }

  override strategyWhenConflictingWithItem(
    item: KeySystemRootKey,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    const baseKeyTimestamp = this.keyParams.creationTimestamp
    const incomingKeyTimestamp = item.keyParams.creationTimestamp

    return incomingKeyTimestamp > baseKeyTimestamp ? ConflictStrategy.KeepApply : ConflictStrategy.KeepBase
  }

  get itemsKey(): string {
    return this.key
  }

  override get key_system_identifier(): undefined {
    return undefined
  }

  override get shared_vault_uuid(): undefined {
    return undefined
  }

  isEqual(other: KeySystemRootKeyInterface): boolean {
    return this.itemsKey === other.itemsKey && this.token === other.token
  }
}
