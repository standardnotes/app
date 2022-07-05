import { Uuid, ContentType } from '@standardnotes/common'
import { TransferPayload } from './../../TransferPayload/Interfaces/TransferPayload'
import { PayloadInterface } from '../../Payload/Interfaces/PayloadInterface'
import { PredicateInterface } from '../../../Runtime/Predicate/Interface'
import { HistoryEntryInterface } from '../../../Runtime/History'
import { ConflictStrategy } from '../Types/ConflictStrategy'
import { SingletonStrategy } from '../Types/SingletonStrategy'

export interface ItemInterface<P extends PayloadInterface = PayloadInterface> {
  payload: P
  readonly conflictOf?: Uuid
  readonly duplicateOf?: Uuid
  readonly createdAtString?: string
  readonly updatedAtString?: string

  uuid: Uuid

  content_type: ContentType
  created_at: Date
  serverUpdatedAt: Date
  serverUpdatedAtTimestamp: number | undefined
  dirty: boolean | undefined

  lastSyncBegan: Date | undefined
  lastSyncEnd: Date | undefined
  neverSynced: boolean

  duplicate_of: string | undefined
  isSingleton: boolean
  updated_at: Date | undefined

  singletonPredicate<T extends ItemInterface>(): PredicateInterface<T>

  singletonStrategy: SingletonStrategy

  strategyWhenConflictingWithItem(item: ItemInterface, previousRevision?: HistoryEntryInterface): ConflictStrategy

  satisfiesPredicate(predicate: PredicateInterface<ItemInterface>): boolean

  payloadRepresentation(override?: Partial<TransferPayload>): P
}
