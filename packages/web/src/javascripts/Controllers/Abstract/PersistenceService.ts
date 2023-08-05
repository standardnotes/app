import { ShouldPersistNoteStateKey } from '@/Components/Preferences/Panes/General/Persistence'
import {
  ApplicationEvent,
  ContentType,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ItemManagerInterface,
  StorageServiceInterface,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { PersistedStateValue, StorageKey } from '@standardnotes/ui-services'
import { CrossControllerEvent } from '../CrossControllerEvent'

export class PersistenceService implements InternalEventHandlerInterface {
  private didHydrateOnce = false

  constructor(
    private storage: StorageServiceInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private eventBus: InternalEventBusInterface,
  ) {
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataLoaded)
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataIncrementalLoad)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.LocalDataLoaded: {
        if (!this.didHydrateOnce) {
          this.hydratePersistedValues()
          this.didHydrateOnce = true
        }
        break
      }

      case ApplicationEvent.LocalDataIncrementalLoad: {
        const canHydrate = this.items.getItems([ContentType.TYPES.Note, ContentType.TYPES.Tag]).length > 0

        if (!canHydrate) {
          return
        }

        this.hydratePersistedValues()
        this.didHydrateOnce = true
        break
      }
    }
  }

  get persistenceEnabled() {
    return this.storage.getValue(ShouldPersistNoteStateKey) ?? true
  }

  hydratePersistedValues = () => {
    this.eventBus.publish({
      type: CrossControllerEvent.HydrateFromPersistedValues,
      payload: this.persistenceEnabled ? this.getPersistedValues() : undefined,
    })
  }

  persistValues(values: PersistedStateValue): void {
    if (!this.sync.isDatabaseLoaded()) {
      return
    }

    if (!this.persistenceEnabled) {
      return
    }

    this.storage.setValue(StorageKey.MasterStatePersistenceKey, values)
  }

  clearPersistedValues(): void {
    if (!this.sync.isDatabaseLoaded()) {
      return
    }

    void this.storage.removeValue(StorageKey.MasterStatePersistenceKey)
  }

  getPersistedValues(): PersistedStateValue {
    return this.storage.getValue(StorageKey.MasterStatePersistenceKey) as PersistedStateValue
  }
}
