import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { GroupKeyContent } from './GroupKeyContent'
import { GroupKeyInterface } from './GroupKeyInterface'

export function isGroupKey(x: { content_type: ContentType }): x is GroupKey {
  return x.content_type === ContentType.GroupKey
}

export class GroupKey extends DecryptedItem<GroupKeyContent> implements GroupKeyInterface {
  groupUuid: string
  groupKey: string
  keyVersion: ProtocolVersion

  constructor(payload: DecryptedPayloadInterface<GroupKeyContent>) {
    super(payload)

    this.groupUuid = payload.content.groupUuid
    this.groupKey = payload.content.groupKey
    this.keyVersion = payload.content.keyVersion
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }

  get itemsKey(): string {
    return this.groupKey
  }
}
