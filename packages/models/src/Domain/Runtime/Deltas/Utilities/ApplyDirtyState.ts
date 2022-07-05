import { ImmutablePayloadCollection } from '../../Collection/Payload/ImmutablePayloadCollection'
import { FullyFormedPayloadInterface } from '../../../Abstract/Payload/Interfaces/UnionTypes'
import { SyncResolvedPayload } from './SyncResolvedPayload'
import { getIncrementedDirtyIndex } from '../../DirtyCounter/DirtyCounter'

export function payloadByFinalizingSyncState(
  payload: FullyFormedPayloadInterface,
  baseCollection: ImmutablePayloadCollection,
): SyncResolvedPayload {
  const basePayload = baseCollection.find(payload.uuid)

  if (!basePayload) {
    return payload.copyAsSyncResolved({
      dirty: false,
      lastSyncEnd: new Date(),
    })
  }

  const stillDirty =
    basePayload.dirtyIndex && basePayload.globalDirtyIndexAtLastSync
      ? basePayload.dirtyIndex > basePayload.globalDirtyIndexAtLastSync
      : false

  return payload.copyAsSyncResolved({
    dirty: stillDirty,
    dirtyIndex: stillDirty ? getIncrementedDirtyIndex() : undefined,
    lastSyncEnd: new Date(),
  })
}

export function payloadsByFinalizingSyncState(
  payloads: FullyFormedPayloadInterface[],
  baseCollection: ImmutablePayloadCollection,
): SyncResolvedPayload[] {
  return payloads.map((p) => payloadByFinalizingSyncState(p, baseCollection))
}
