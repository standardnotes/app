import { ConflictParams, ConflictType } from '@standardnotes/responses'
import {
  ImmutablePayloadCollection,
  HistoryMap,
  DeltaRemoteRetrieved,
  DeltaRemoteSaved,
  DeltaRemoteDataConflicts,
  FullyFormedPayloadInterface,
  ServerSyncPushContextualPayload,
  ServerSyncSavedContextualPayload,
  DeltaRemoteUuidConflicts,
  DeltaRemoteRejected,
  DeltaEmit,
} from '@standardnotes/models'
import { DecryptedServerConflictMap } from './ServerConflictMap'

type PayloadSet = {
  retrievedPayloads: FullyFormedPayloadInterface[]
  savedPayloads: ServerSyncSavedContextualPayload[]
  conflicts: DecryptedServerConflictMap
}

/**
 * Given a remote sync response, the resolver applies the incoming changes on top
 * of the current base state, and returns what the new global state should look like.
 * The response resolver is purely functional and does not modify global state, but instead
 * offers the 'recommended' new global state given a sync response and a current base state.
 */
export class ServerSyncResponseResolver {
  constructor(
    private payloadSet: PayloadSet,
    private baseCollection: ImmutablePayloadCollection<FullyFormedPayloadInterface>,
    private payloadsSavedOrSaving: ServerSyncPushContextualPayload[],
    private historyMap: HistoryMap,
  ) {}

  public result(): DeltaEmit[] {
    const emits: DeltaEmit[] = []

    emits.push(this.processRetrievedPayloads())
    emits.push(this.processSavedPayloads())
    emits.push(this.processUuidConflictUnsavedPayloads())
    emits.push(this.processDataConflictServerPayloads())
    emits.push(this.processRejectedPayloads())

    return emits
  }

  private processSavedPayloads(): DeltaEmit {
    const delta = new DeltaRemoteSaved(this.baseCollection, this.payloadSet.savedPayloads)

    return delta.result()
  }

  private processRetrievedPayloads(): DeltaEmit {
    const collection = ImmutablePayloadCollection.WithPayloads(this.payloadSet.retrievedPayloads)

    const delta = new DeltaRemoteRetrieved(this.baseCollection, collection, this.payloadsSavedOrSaving, this.historyMap)

    return delta.result()
  }

  private getConflictsForType<T extends ConflictParams<FullyFormedPayloadInterface>>(type: ConflictType): T[] {
    const results = this.payloadSet.conflicts[type] || []

    return results as T[]
  }

  private processDataConflictServerPayloads(): DeltaEmit {
    const delta = new DeltaRemoteDataConflicts(
      this.baseCollection,
      this.getConflictsForType(ConflictType.ConflictingData),
      this.historyMap,
    )

    return delta.result()
  }

  private processUuidConflictUnsavedPayloads(): DeltaEmit {
    const delta = new DeltaRemoteUuidConflicts(this.baseCollection, this.getConflictsForType(ConflictType.UuidConflict))

    return delta.result()
  }

  private processRejectedPayloads(): DeltaEmit {
    const conflicts = [
      ...this.getConflictsForType(ConflictType.ContentTypeError),
      ...this.getConflictsForType(ConflictType.ContentError),
      ...this.getConflictsForType(ConflictType.ReadOnlyError),
      ...this.getConflictsForType(ConflictType.UuidError),
      ...this.getConflictsForType(ConflictType.SharedVaultSnjsVersionError),
      ...this.getConflictsForType(ConflictType.SharedVaultInsufficientPermissionsError),
      ...this.getConflictsForType(ConflictType.SharedVaultNotMemberError),
      ...this.getConflictsForType(ConflictType.SharedVaultInvalidState),
      ...this.getConflictsForType(ConflictType.InvalidServerItem),
    ]

    const delta = new DeltaRemoteRejected(this.baseCollection, conflicts)
    const result = delta.result()
    return result
  }
}
