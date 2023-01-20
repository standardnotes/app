import { remove } from 'lodash'
import { ImmutablePayloadCollection } from '../../Runtime/Collection/Payload/ImmutablePayloadCollection'
import { ContentReference } from '../../Abstract/Reference/ContentReference'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { FullyFormedPayloadInterface } from '../../Abstract/Payload/Interfaces/UnionTypes'
import { isDecryptedPayload } from '../../Abstract/Payload'
import { SyncResolvedPayload } from '../../Runtime/Deltas/Utilities/SyncResolvedPayload'
import { getIncrementedDirtyIndex } from '../../Runtime/DirtyCounter/DirtyCounter'

export function PayloadsByUpdatingReferencingPayloadReferences(
  payload: DecryptedPayloadInterface,
  baseCollection: ImmutablePayloadCollection<FullyFormedPayloadInterface>,
  add: FullyFormedPayloadInterface[] = [],
  removeIds: string[] = [],
): SyncResolvedPayload[] {
  const referencingPayloads = baseCollection.elementsReferencingElement(payload).filter(isDecryptedPayload)

  const results: SyncResolvedPayload[] = []

  for (const referencingPayload of referencingPayloads) {
    const references = referencingPayload.content.references.slice()
    const reference = referencingPayload.getReference(payload.uuid)

    for (const addPayload of add) {
      const newReference: ContentReference = {
        ...reference,
        uuid: addPayload.uuid,
        content_type: addPayload.content_type,
      }
      references.push(newReference)
    }

    for (const id of removeIds) {
      remove(references, { uuid: id })
    }

    const result = referencingPayload.copyAsSyncResolved({
      dirty: true,
      dirtyIndex: getIncrementedDirtyIndex(),
      lastSyncEnd: new Date(),
      content: {
        ...referencingPayload.content,
        references,
      },
    })

    results.push(result)
  }

  return results
}
