import { WebApplication } from '@/Application/Application'
import { ApplicationEvent } from '@standardnotes/snjs'
import { ViewControllerManager } from '../ViewControllerManager'

const MasterPersistenceKey = 'master-persistence-key'

export enum PersistenceKey {
  SelectedItemsController = 'selected-items-controller',
  NavigationController = 'navigation-controller',
}

export type MasterPersistedValue = Record<PersistenceKey, unknown>

export class PersistenceService {
  private unsubAppEventObserver: () => void

  constructor(private application: WebApplication, private viewControllerManager: ViewControllerManager) {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      if (!this.application) {
        return
      }

      void this.onAppEvent(eventName)
    })
  }

  async onAppEvent(eventName: ApplicationEvent) {
    if (eventName === ApplicationEvent.LocalDataLoaded) {
      this.viewControllerManager.hydrateFromPersistedValues()
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
