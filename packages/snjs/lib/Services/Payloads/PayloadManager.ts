import { ContentType } from '@standardnotes/domain-core'
import { PayloadsChangeObserver, QueueElement, PayloadsChangeObserverCallback, EmitQueue } from './Types'
import { LoggerInterface, removeFromArray, Uuids } from '@standardnotes/utils'
import {
  DeltaFileImport,
  isDeletedPayload,
  ImmutablePayloadCollection,
  EncryptedPayloadInterface,
  PayloadSource,
  DeletedPayloadInterface,
  DecryptedPayloadInterface,
  PayloadCollection,
  PayloadEmitSource,
  DeletedPayload,
  FullyFormedPayloadInterface,
  isEncryptedPayload,
  isDecryptedPayload,
  HistoryMap,
  DeltaEmit,
  getIncrementedDirtyIndex,
} from '@standardnotes/models'
import {
  AbstractService,
  PayloadManagerInterface,
  InternalEventBusInterface,
  DiagnosticInfo,
} from '@standardnotes/services'
import { IntegrityPayload } from '@standardnotes/responses'

/**
 * The payload manager is responsible for keeping state regarding what items exist in the
 * global application state. It does so by exposing functions that allow consumers to 'map'
 * a detached payload into global application state. Whenever a change is made or retrieved
 * from any source, it must be mapped in order to be properly reflected in global application state.
 * The model manager deals only with in-memory state, and does not deal directly with storage.
 * It also serves as a query store, and can be queried for current notes, tags, etc.
 * It exposes methods that allow consumers to listen to mapping events. This is how
 * applications 'stream' items to display in the interface.
 */
export class PayloadManager extends AbstractService implements PayloadManagerInterface {
  private changeObservers: PayloadsChangeObserver[] = []
  public collection: PayloadCollection<FullyFormedPayloadInterface>
  private emitQueue: EmitQueue<FullyFormedPayloadInterface> = []

  constructor(
    private logger: LoggerInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.collection = new PayloadCollection()
  }

  /**
   * Our payload collection keeps the latest mapped payload for every payload
   * that passes through our mapping function. Use this to query current state
   * as needed to make decisions, like about duplication or uuid alteration.
   */
  public getMasterCollection() {
    return ImmutablePayloadCollection.FromCollection(this.collection)
  }

  public override deinit() {
    super.deinit()
    this.changeObservers.length = 0
    this.resetState()
  }

  public resetState() {
    this.collection = new PayloadCollection()
  }

  public find(uuids: string[]): FullyFormedPayloadInterface[] {
    return this.collection.findAll(uuids)
  }

  public findOne(uuid: string): FullyFormedPayloadInterface | undefined {
    return this.collection.findAll([uuid])[0]
  }

  public all(contentType: string): FullyFormedPayloadInterface[] {
    return this.collection.all(contentType)
  }

  public get integrityPayloads(): IntegrityPayload[] {
    return this.collection.integrityPayloads()
  }

  public get nonDeletedItems(): FullyFormedPayloadInterface[] {
    return this.collection.nondeletedElements()
  }

  public get invalidPayloads(): EncryptedPayloadInterface[] {
    return this.collection.invalidElements()
  }

  public async emitDeltaEmit<P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface>(
    emit: DeltaEmit<P>,
    sourceKey?: string,
  ): Promise<P[]> {
    if (emit.emits.length === 0 && emit.ignored?.length === 0) {
      return []
    }

    return new Promise((resolve) => {
      const element: QueueElement<P> = {
        emit: emit,
        sourceKey,
        resolve,
      }

      this.emitQueue.push(element as unknown as QueueElement<FullyFormedPayloadInterface>)

      if (this.emitQueue.length === 1) {
        void this.popQueue()
      }
    })
  }

  /**
   * One of many mapping helpers available.
   * This function maps a payload to an item
   * @returns every paylod altered as a result of this operation, to be
   * saved to storage by the caller
   */
  public async emitPayload<P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface>(
    payload: P,
    source: PayloadEmitSource,
    sourceKey?: string,
  ): Promise<P[]> {
    return this.emitPayloads([payload], source, sourceKey)
  }

  /**
   * This function maps multiple payloads to items, and is the authoratative mapping
   * function that all other mapping helpers rely on
   * @returns every paylod altered as a result of this operation, to be
   * saved to storage by the caller
   */
  public async emitPayloads<P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface>(
    payloads: P[],
    source: PayloadEmitSource,
    sourceKey?: string,
  ): Promise<P[]> {
    const emit: DeltaEmit<P> = {
      emits: payloads,
      source: source,
    }

    return this.emitDeltaEmit(emit, sourceKey)
  }

  private popQueue() {
    const first = this.emitQueue[0]

    const { changed, inserted, discarded, unerrored } = this.applyPayloads(first.emit.emits)

    this.notifyChangeObservers(
      changed,
      inserted,
      discarded,
      first.emit.ignored || [],
      unerrored,
      first.emit.source,
      first.sourceKey,
    )

    removeFromArray(this.emitQueue, first)

    first.resolve([...changed, ...inserted, ...discarded])

    if (this.emitQueue.length > 0) {
      void this.popQueue()
    }
  }

  private applyPayloads(applyPayloads: FullyFormedPayloadInterface[]) {
    const changed: FullyFormedPayloadInterface[] = []
    const inserted: FullyFormedPayloadInterface[] = []
    const discarded: DeletedPayloadInterface[] = []
    const unerrored: DecryptedPayloadInterface[] = []

    for (const apply of applyPayloads) {
      if (!apply.uuid || !apply.content_type) {
        console.error('Payload is corrupt', apply)

        continue
      }

      this.logger.debug(
        'applying payload',
        apply.uuid,
        'globalDirtyIndexAtLastSync',
        apply.globalDirtyIndexAtLastSync,
        'dirtyIndex',
        apply.dirtyIndex,
        'dirty',
        apply.dirty,
      )

      const base = this.collection.find(apply.uuid)

      if (isDeletedPayload(apply) && apply.discardable) {
        this.collection.discard(apply)

        discarded.push(apply)
      } else {
        this.collection.set(apply)

        if (base) {
          changed.push(apply)

          if (isEncryptedPayload(base) && isDecryptedPayload(apply)) {
            unerrored.push(apply)
          }
        } else {
          inserted.push(apply)
        }
      }
    }

    return { changed, inserted, discarded, unerrored }
  }

  /**
   * Notifies observers when an item has been mapped.
   * @param types - An array of content types to listen for
   * @param priority - The lower the priority, the earlier the function is called
   *  wrt to other observers
   */
  public addObserver(types: string | string[], callback: PayloadsChangeObserverCallback, priority = 1) {
    if (!Array.isArray(types)) {
      types = [types]
    }
    const observer: PayloadsChangeObserver = {
      types,
      priority,
      callback,
    }
    this.changeObservers.push(observer)

    const thislessChangeObservers = this.changeObservers
    return () => {
      removeFromArray(thislessChangeObservers, observer)
    }
  }

  /**
   * This function is mostly for internal use, but can be used externally by consumers who
   * explicitely understand what they are doing (want to propagate model state without mapping)
   */
  public notifyChangeObservers(
    changed: FullyFormedPayloadInterface[],
    inserted: FullyFormedPayloadInterface[],
    discarded: DeletedPayloadInterface[],
    ignored: EncryptedPayloadInterface[],
    unerrored: DecryptedPayloadInterface[],
    source: PayloadEmitSource,
    sourceKey?: string,
  ) {
    /** Slice the observers array as sort modifies in-place */
    const observers = this.changeObservers.slice().sort((a, b) => {
      return a.priority < b.priority ? -1 : 1
    })

    const filter = <P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface>(
      payloads: P[],
      types: string[],
    ) => {
      return types.includes(ContentType.TYPES.Any)
        ? payloads.slice()
        : payloads.slice().filter((payload) => {
            return types.includes(payload.content_type)
          })
    }

    for (const observer of observers) {
      observer.callback({
        changed: filter(changed, observer.types),
        inserted: filter(inserted, observer.types),
        discarded: filter(discarded, observer.types),
        ignored: filter(ignored, observer.types),
        unerrored: filter(unerrored, observer.types),
        source,
        sourceKey,
      })
    }
  }

  /**
   * Imports an array of payloads from an external source (such as a backup file)
   * and marks the items as dirty.
   */
  public async importPayloads(payloads: FullyFormedPayloadInterface[], historyMap: HistoryMap): Promise<string[]> {
    const sourcedPayloads = payloads.map((p) => p.copy(undefined, PayloadSource.FileImport))

    const delta = new DeltaFileImport(this.getMasterCollection(), sourcedPayloads, historyMap)
    const emit = delta.result()

    await this.emitDeltaEmit(emit)

    return Uuids(payloads)
  }

  public removePayloadLocally(payload: FullyFormedPayloadInterface | FullyFormedPayloadInterface[]): void {
    this.collection.discard(payload)
  }

  public erroredPayloadsForContentType(contentType: string): EncryptedPayloadInterface[] {
    return this.collection.invalidElements().filter((p) => p.content_type === contentType)
  }

  public async deleteErroredPayloads(payloads: EncryptedPayloadInterface[]): Promise<void> {
    const deleted = payloads.map(
      (payload) =>
        new DeletedPayload(
          {
            ...payload.ejected(),
            deleted: true,
            content: undefined,
            dirty: true,
            dirtyIndex: getIncrementedDirtyIndex(),
          },
          payload.source,
        ),
    )

    await this.emitPayloads(deleted, PayloadEmitSource.LocalChanged)
  }

  override getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return Promise.resolve({
      payloads: {
        integrityPayloads: this.integrityPayloads,
        nonDeletedItemCount: this.nonDeletedItems.length,
        invalidPayloadsCount: this.invalidPayloads.length,
      },
    })
  }
}
