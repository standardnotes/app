import { DeletedPayload } from '../../Abstract/Payload/Implementations/DeletedPayload'
import { extendArray, UuidGenerator } from '@standardnotes/utils'
import { ImmutablePayloadCollection } from '../../Runtime/Collection/Payload/ImmutablePayloadCollection'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { isEncryptedPayload } from '../../Abstract/Payload/Interfaces/TypeCheck'
import { FullyFormedPayloadInterface } from '../../Abstract/Payload/Interfaces/UnionTypes'
import { EncryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/EncryptedPayload'
import { PayloadsByUpdatingReferencingPayloadReferences } from './PayloadsByUpdatingReferencingPayloadReferences'
import { SyncResolvedPayload } from '../../Runtime/Deltas/Utilities/SyncResolvedPayload'
import { getIncrementedDirtyIndex } from '../../Runtime/DirtyCounter/DirtyCounter'
import { ContentType } from '@standardnotes/domain-core'

/**
 * Return the payloads that result if you alternated the uuid for the payload.
 * Alternating a UUID involves instructing related items to drop old references of a uuid
 * for the new one.
 * @returns An array of payloads that have changed as a result of copying.
 */

export function PayloadsByAlternatingUuid<P extends DecryptedPayloadInterface = DecryptedPayloadInterface>(
  payload: P,
  baseCollection: ImmutablePayloadCollection<FullyFormedPayloadInterface>,
): SyncResolvedPayload[] {
  const results: SyncResolvedPayload[] = []
  /**
   * We need to clone payload and give it a new uuid,
   * then delete item with old uuid from db (cannot modify uuids in our IndexedDB setup)
   */
  const copy = payload.copyAsSyncResolved({
    uuid: UuidGenerator.GenerateUuid(),
    dirty: true,
    dirtyIndex: getIncrementedDirtyIndex(),
    lastSyncBegan: undefined,
    lastSyncEnd: new Date(),
    duplicate_of: payload.uuid,
  })

  results.push(copy)

  /**
   * Get the payloads that make reference to payload and remove
   * payload as a relationship, instead adding the new copy.
   */
  const updatedReferencing = PayloadsByUpdatingReferencingPayloadReferences(
    payload,
    baseCollection,
    [copy],
    [payload.uuid],
  )

  extendArray(results, updatedReferencing)

  if (payload.content_type === ContentType.TYPES.ItemsKey) {
    /**
     * Update any payloads who are still encrypted and whose items_key_id point to this uuid
     */
    const matchingPayloads = baseCollection
      .all()
      .filter((p) => isEncryptedPayload(p) && p.items_key_id === payload.uuid) as EncryptedPayloadInterface[]

    const adjustedPayloads = matchingPayloads.map((a) =>
      a.copyAsSyncResolved({
        items_key_id: copy.uuid,
        dirty: true,
        dirtyIndex: getIncrementedDirtyIndex(),
        lastSyncEnd: new Date(),
      }),
    )

    if (adjustedPayloads.length > 0) {
      extendArray(results, adjustedPayloads)
    }
  }

  const deletedSelf = new DeletedPayload(
    {
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      created_at_timestamp: payload.created_at_timestamp,
      updated_at_timestamp: payload.updated_at_timestamp,
      /**
       * Do not set as dirty; this item is non-syncable
       * and should be immediately discarded
       */
      dirty: false,
      content: undefined,
      uuid: payload.uuid,
      content_type: payload.content_type,
      deleted: true,
    },
    payload.source,
  )

  results.push(deletedSelf as SyncResolvedPayload)

  return results
}
