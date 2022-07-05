import { ImmutablePayloadCollection } from '../../Collection/Payload/ImmutablePayloadCollection'
import { SyncDeltaEmit } from './DeltaEmit'

export interface SyncDeltaInterface {
  baseCollection: ImmutablePayloadCollection

  result(): SyncDeltaEmit
}
