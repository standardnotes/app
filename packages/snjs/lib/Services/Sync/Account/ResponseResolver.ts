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

type PayloadSet = {
  retrievedPayloads: FullyFormedPayloadInterface[]
  savedPayloads: ServerSyncSavedContextualPayload[]
  uuidConflictPayloads: FullyFormedPayloadInterface[]
  dataConflictPayloads: FullyFormedPayloadInterface[]
  rejectedPayloads: FullyFormedPayloadInterface[]
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
    emits.push(this.processUuidConflictPayloads())
    emits.push(this.processDataConflictPayloads())
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

  private processDataConflictPayloads(): DeltaEmit {
    const collection = ImmutablePayloadCollection.WithPayloads(this.payloadSet.dataConflictPayloads)

    const delta = new DeltaRemoteDataConflicts(this.baseCollection, collection, this.historyMap)

    return delta.result()
  }

  private processUuidConflictPayloads(): DeltaEmit {
    const collection = ImmutablePayloadCollection.WithPayloads(this.payloadSet.uuidConflictPayloads)

    const delta = new DeltaRemoteUuidConflicts(this.baseCollection, collection)

    return delta.result()
  }

  private processRejectedPayloads(): DeltaEmit {
    const collection = ImmutablePayloadCollection.WithPayloads(this.payloadSet.rejectedPayloads)

    const delta = new DeltaRemoteRejected(this.baseCollection, collection)

    return delta.result()
  }
}
