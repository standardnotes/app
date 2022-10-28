import { WebApplication } from '@/Application/Application'
import { ShouldPersistNoteStateKey } from '@/Components/Preferences/Panes/General/Persistence'
import { ApplicationEvent, InternalEventBus, MasterStatePersistenceKey, PersistedStateValue } from '@standardnotes/snjs'
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

  hydratePersistedValues = () => {
    let shouldIgnorePersistedValues = this.application.getValue(ShouldPersistNoteStateKey)

    if (typeof shouldIgnorePersistedValues === 'undefined') {
      this.application.setValue(ShouldPersistNoteStateKey, true)
      shouldIgnorePersistedValues = true
    }

    this.eventBus.publish({
      type: CrossControllerEvent.HydrateFromPersistedValues,
      payload: shouldIgnorePersistedValues ? this.getPersistedValues() : undefined,
    })
  }

  persistValues(values: PersistedStateValue): void {
    if (!this.application.isDatabaseLoaded()) {
      return
    }

    let shouldPersistState = this.application.getValue(ShouldPersistNoteStateKey)

    if (typeof shouldPersistState === 'undefined') {
      this.application.setValue(ShouldPersistNoteStateKey, true)
      shouldPersistState = true
    }

    if (!shouldPersistState) {
      return
    }

    this.application.setValue(MasterStatePersistenceKey, values)
  }

  clearPersistedValues(): void {
    if (!this.application.isDatabaseLoaded()) {
      return
    }

    this.application.setValue(MasterStatePersistenceKey, undefined)
  }

  getPersistedValues(): PersistedStateValue {
    return this.application.getValue(MasterStatePersistenceKey) as PersistedStateValue
  }

  deinit() {
    this.unsubAppEventObserver()
  }
}
