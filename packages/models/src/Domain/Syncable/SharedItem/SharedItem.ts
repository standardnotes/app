import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { SharedItemDuration } from './SharedItemDuration'
import { SharedItemContent } from './SharedItemContent'
import { SharedItemPermission } from './SharedItemPermission'
import { HistoryEntryInterface } from '../../Runtime/History'

export class SharedItem extends DecryptedItem<SharedItemContent> {
  public readonly itemUuid: string
  public readonly privateKey: string
  public readonly publicKey: string
  public readonly shareToken: string
  public readonly duration: SharedItemDuration
  public readonly isUserOriginator: boolean
  public readonly permissions: SharedItemPermission
  public readonly expired: boolean

  constructor(payload: DecryptedPayloadInterface<SharedItemContent>) {
    super(payload)

    this.itemUuid = this.content.itemUuid
    this.privateKey = this.content.privateKey
    this.publicKey = this.content.publicKey
    this.shareToken = this.content.shareToken
    this.duration = this.content.duration
    this.isUserOriginator = this.content.isUserOriginator
    this.permissions = this.content.permissions
    this.expired = this.content.expired
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
