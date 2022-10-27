import { WebApplication } from '@/Application/Application'
import { ShouldPersistNoteStateKey } from '@/Components/Preferences/Panes/General/Persistence'
import { ApplicationEvent, InternalEventBus, MasterStatePersistenceKey, PersistedStateValue } from '@standardnotes/snjs'
import { CrossControllerEvent } from '../CrossControllerEvent'

export class PersistenceService {
  private unsubAppEventObserver: () => void

  constructor(private application: WebApplication, private eventBus: InternalEventBus) {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      if (!this.application) {
        return
      }

      void this.onAppEvent(eventName)
    })
  }

  async onAppEvent(eventName: ApplicationEvent) {
    if (eventName === ApplicationEvent.LocalDataIncrementalLoad) {
      let shouldHydrateState = this.application.getValue(ShouldPersistNoteStateKey)

      if (typeof shouldHydrateState === 'undefined') {
        this.application.setValue(ShouldPersistNoteStateKey, true)
        shouldHydrateState = true
      }

      this.eventBus.publish({
        type: CrossControllerEvent.HydrateFromPersistedValues,
        payload: shouldHydrateState ? this.getPersistedValues() : undefined,
      })
    }
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
