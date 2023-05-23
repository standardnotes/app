import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { ConflictStrategy, DecryptedItem } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { GroupKeyContent } from './GroupKeyContent'
import { GroupKeyInterface } from './GroupKeyInterface'

export function isGroupKey(x: { content_type: ContentType }): x is GroupKey {
  return x.content_type === ContentType.GroupKey
}

export class GroupKey extends DecryptedItem<GroupKeyContent> implements GroupKeyInterface {
  groupUuid: string
  groupName?: string
  groupDescription?: string
  groupKey: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  constructor(payload: DecryptedPayloadInterface<GroupKeyContent>) {
    super(payload)

    this.groupUuid = payload.content.groupUuid
    this.groupName = payload.content.groupName
    this.groupDescription = payload.content.groupDescription
    this.groupKey = payload.content.groupKey
    this.keyTimestamp = payload.content.keyTimestamp
    this.keyVersion = payload.content.keyVersion
  }

  override strategyWhenConflictingWithItem(
    item: GroupKey,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    const baseKeyTimestamp = this.keyTimestamp
    const incomingKeyTimestamp = item.keyTimestamp
    return incomingKeyTimestamp > baseKeyTimestamp ? ConflictStrategy.KeepApply : ConflictStrategy.KeepBase
  }

  get itemsKey(): string {
    return this.groupKey
  }
}
