import { WebApplication } from '@/Application/Application'
import { ApplicationEvent } from '@standardnotes/snjs'

export enum PersistedStateKey {
  SelectionController = 'selectionController',
  NavigationController = 'navigationController',
}

export class StatePersistenceHandler<PersistableState> {
  private unsubAppEventObserver!: () => void

  constructor(
    protected application: WebApplication,
    protected persistenceKey: PersistedStateKey,
    protected getPersistableState: () => PersistableState,
    protected hydrateFromStorage: (state: PersistableState) => void,
  ) {
    this.addAppEventObserver()
  }

  addAppEventObserver() {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      if (!this.application) {
        return
      }

      void this.onAppEvent(eventName)
    })
  }

  async onAppEvent(eventName: ApplicationEvent) {
    if (eventName === ApplicationEvent.LocalDataLoaded) {
      const persistedState = this.getPersistedStateFromStorage()
      if (persistedState) {
        this.hydrateFromStorage(persistedState)
      }
    }
  }

  persistValuesToStorage = () => {
    const valuesToPersist = this.getPersistableState()
    this.application.setValue(this.persistenceKey, valuesToPersist)
  }

  private getPersistedStateFromStorage = (): PersistableState => {
    return this.application.getValue(this.persistenceKey) as PersistableState
  }

  deinit() {
    this.unsubAppEventObserver()
  }
}
