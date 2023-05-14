import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { GroupKeyContent } from './GroupKeyContent'
import { HistoryEntryInterface } from '../../Runtime/History'
import { GroupKeyInterface } from './GroupKeyInterface'
import { ProtocolVersion } from '@standardnotes/common'

export class GroupKey extends DecryptedItem<GroupKeyContent> implements GroupKeyInterface {
  readonly key: string
  readonly groupUuid: string
  keyVersion: ProtocolVersion

  constructor(payload: DecryptedPayloadInterface<GroupKeyContent>) {
    super(payload)

    this.key = this.content.key
    this.keyVersion = payload.content.version
    this.groupUuid = this.content.groupUuid
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }

  public get itemsKey(): string {
    return this.key
  }
}
