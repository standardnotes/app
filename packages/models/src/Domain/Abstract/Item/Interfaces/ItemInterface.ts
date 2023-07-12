import { TransferPayload } from './../../TransferPayload/Interfaces/TransferPayload'
import { PayloadInterface } from '../../Payload/Interfaces/PayloadInterface'
import { PredicateInterface } from '../../../Runtime/Predicate/Interface'
import { HistoryEntryInterface } from '../../../Runtime/History'
import { ConflictStrategy } from '../Types/ConflictStrategy'
import { SingletonStrategy } from '../Types/SingletonStrategy'
import { PersistentSignatureData } from '../../../Runtime/Encryption/PersistentSignatureData'

export interface ItemInterface<P extends PayloadInterface = PayloadInterface> {
  payload: P
  readonly conflictOf?: string
  readonly duplicateOf?: string
  readonly createdAtString?: string
  readonly updatedAtString?: string

  uuid: string
  get key_system_identifier(): string | undefined
  get user_uuid(): string | undefined
  get shared_vault_uuid(): string | undefined
  get last_edited_by_uuid(): string | undefined
  get signatureData(): PersistentSignatureData | undefined

  content_type: string
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
