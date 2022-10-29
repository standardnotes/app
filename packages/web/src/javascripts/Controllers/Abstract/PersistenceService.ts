import { WebApplication } from '@/Application/Application'
import { ShouldPersistNoteStateKey } from '@/Components/Preferences/Panes/General/Persistence'
import { ApplicationEvent, InternalEventBus } from '@standardnotes/snjs'
import { PersistedStateValue, StorageKey } from '@standardnotes/ui-services'
import { CrossControllerEvent } from '../CrossControllerEvent'

export class PersistenceService {
  private unsubAppEventObserver: () => void
  private didIncrementalLoad = false

  constructor(private application: WebApplication, private eventBus: InternalEventBus) {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      if (!this.application) {
        return
      }

      void this.onAppEvent(eventName)
    })
  }

  async onAppEvent(eventName: ApplicationEvent) {
    if (eventName === ApplicationEvent.LocalDataLoaded && !this.didIncrementalLoad) {
      this.hydratePersistedValues()
    }
    if (eventName === ApplicationEvent.LocalDataIncrementalLoad) {
      this.didIncrementalLoad = true
      this.hydratePersistedValues()
    }
  }

  get persistenceEnabled() {
    return this.application.getValue(ShouldPersistNoteStateKey) ?? true
  }

  hydratePersistedValues = () => {
    this.eventBus.publish({
      type: CrossControllerEvent.HydrateFromPersistedValues,
      payload: this.persistenceEnabled ? this.getPersistedValues() : undefined,
    })
  }

  persistValues(values: PersistedStateValue): void {
    if (!this.application.isDatabaseLoaded()) {
      return
    }

    if (!this.persistenceEnabled) {
      return
    }

    this.application.setValue(StorageKey.MasterStatePersistenceKey, values)
  }

  clearPersistedValues(): void {
    if (!this.application.isDatabaseLoaded()) {
      return
    }

    this.application.removeValue(StorageKey.MasterStatePersistenceKey)
  }

  getPersistedValues(): PersistedStateValue {
    return this.application.getValue(StorageKey.MasterStatePersistenceKey) as PersistedStateValue
  }

  deinit() {
    this.unsubAppEventObserver()
  }
}
