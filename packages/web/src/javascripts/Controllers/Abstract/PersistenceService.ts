import { WebApplication } from '@/Application/Application'
import { ShouldPersistNoteStateKey } from '@/Components/Preferences/Panes/General/Persistence'
import { ApplicationEvent, InternalEventBus } from '@standardnotes/snjs'
import { CrossControllerEvent } from '../CrossControllerEvent'

const MasterPersistenceKey = 'master-persistence-key'

export enum PersistenceKey {
  SelectedItemsController = 'selected-items-controller',
  NavigationController = 'navigation-controller',
  ItemListController = 'item-list-controller',
}

export type MasterPersistedValue = Record<PersistenceKey, unknown>

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

  persistValues(values: MasterPersistedValue): void {
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

    this.application.setValue(MasterPersistenceKey, values)
  }

  getPersistedValues(): MasterPersistedValue {
    return this.application.getValue(MasterPersistenceKey) as MasterPersistedValue
  }

  deinit() {
    this.unsubAppEventObserver()
  }
}
