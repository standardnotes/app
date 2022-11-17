import { WebApplication } from '@/Application/Application'
import { ShouldPersistNoteStateKey } from '@/Components/Preferences/Panes/General/Persistence'
import { ApplicationEvent, ContentType, InternalEventBus } from '@standardnotes/snjs'
import { PersistedStateValue, StorageKey } from '@standardnotes/ui-services'
import { CrossControllerEvent } from '../CrossControllerEvent'

export class PersistenceService {
  private unsubAppEventObserver: () => void
  private didHydrateOnce = false

  constructor(private application: WebApplication, private eventBus: InternalEventBus) {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      if (!this.application) {
        return
      }

      void this.onAppEvent(eventName)
    })
  }

  async onAppEvent(eventName: ApplicationEvent) {
    if (eventName === ApplicationEvent.LocalDataLoaded && !this.didHydrateOnce) {
      this.hydratePersistedValues()
      this.didHydrateOnce = true
    } else if (eventName === ApplicationEvent.LocalDataIncrementalLoad) {
      const canHydrate = this.application.items.getItems([ContentType.Note, ContentType.Tag]).length > 0

      if (!canHydrate) {
        return
      }

      this.hydratePersistedValues()
      this.didHydrateOnce = true
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

    void this.application.removeValue(StorageKey.MasterStatePersistenceKey)
  }

  getPersistedValues(): PersistedStateValue {
    return this.application.getValue(StorageKey.MasterStatePersistenceKey) as PersistedStateValue
  }

  deinit() {
    this.unsubAppEventObserver()
  }
}
