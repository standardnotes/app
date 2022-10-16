import { WebApplication } from '@/Application/Application'
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
    if (eventName === ApplicationEvent.LocalDataLoaded) {
      this.eventBus.publish({
        type: CrossControllerEvent.HydrateFromPersistedValues,
        payload: undefined,
      })
    }
  }

  persistValues(values: MasterPersistedValue): void {
    if (!this.application.isDatabaseLoaded()) {
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
