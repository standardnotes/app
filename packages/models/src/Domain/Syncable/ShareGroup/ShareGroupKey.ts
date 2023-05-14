import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { ShareGroupKeyContent } from './ShareGroupKeyContent'
import { ShareGroupKeyPermission } from './ShareGroupKeyPermission'
import { HistoryEntryInterface } from '../../Runtime/History'
import { ShareGroupKeyInterface } from './ShareGroupKeyInterface'
import { ProtocolVersion } from '@standardnotes/common'

export class ShareGroupKey extends DecryptedItem<ShareGroupKeyContent> implements ShareGroupKeyInterface {
  public readonly privateKey: string
  public readonly publicKey: string
  public readonly apiToken: string
  public readonly groupKey: string
  public readonly isUserOriginator: boolean
  public readonly permissions: ShareGroupKeyPermission
  keyVersion: ProtocolVersion

  constructor(payload: DecryptedPayloadInterface<ShareGroupKeyContent>) {
    super(payload)

    this.privateKey = this.content.privateKey
    this.publicKey = this.content.publicKey
    this.apiToken = this.content.apiToken
    this.groupKey = this.content.groupKey
    this.isUserOriginator = this.content.isUserOriginator
    this.permissions = this.content.permissions
    this.keyVersion = payload.content.version
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }

  public get itemsKey(): string {
    return this.groupKey
  }
}
