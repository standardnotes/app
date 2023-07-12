import { SyncResolvedParams, SyncResolvedPayload } from './../../../Runtime/Deltas/Utilities/SyncResolvedPayload'
import { ItemContent } from '../../Content/ItemContent'
import { TransferPayload } from '../../TransferPayload/Interfaces/TransferPayload'
import { PayloadSource } from '../Types/PayloadSource'
import { PersistentSignatureData } from '../../../Runtime/Encryption/PersistentSignatureData'

export interface PayloadInterface<T extends TransferPayload = TransferPayload, C extends ItemContent = ItemContent> {
  readonly source: PayloadSource
  readonly uuid: string
  readonly content_type: string
  content: C | string | undefined
  deleted: boolean

  /** updated_at is set by the server only, and not the client.*/
  readonly updated_at: Date
  readonly created_at: Date
  readonly created_at_timestamp: number
  readonly updated_at_timestamp: number
  get serverUpdatedAt(): Date
  get serverUpdatedAtTimestamp(): number

  readonly dirtyIndex?: number
  readonly globalDirtyIndexAtLastSync?: number
  readonly dirty?: boolean
  readonly signatureData?: PersistentSignatureData

  readonly lastSyncBegan?: Date
  readonly lastSyncEnd?: Date

  readonly duplicate_of?: string

  readonly user_uuid?: string
  readonly key_system_identifier?: string | undefined
  readonly shared_vault_uuid?: string | undefined
  readonly last_edited_by_uuid?: string

  /**
   * "Ejected" means a payload for
   * generic, non-contextual consumption, such as saving to a backup file or syncing
   * with a server.
   */
  ejected(): TransferPayload

  copy(override?: Partial<T>, source?: PayloadSource): this

  copyAsSyncResolved(override?: Partial<T> & SyncResolvedParams, source?: PayloadSource): SyncResolvedPayload
}
