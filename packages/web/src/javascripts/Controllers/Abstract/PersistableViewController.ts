import { WebApplication } from '@/Application/Application'
import { ApplicationEvent, InternalEventBus } from '@standardnotes/snjs'
import { AbstractViewController } from './AbstractViewController'

export enum PersistedStateKey {
  SelectionController = 'selectionController',
  NavigationController = 'navigationController',
}

export abstract class PersistableViewController<PersistableState> extends AbstractViewController {
  abstract getPersistableState(): PersistableState
  abstract hydrateFromStorage(state: PersistableState): void

  constructor(application: WebApplication, eventBus: InternalEventBus, protected persistenceKey: PersistedStateKey) {
    super(application, eventBus)

    this.disposers.push(
      application.addEventObserver(async () => {
        const persistedState = this.getPersistedStateFromStorage()
        if (persistedState) {
          this.hydrateFromStorage(persistedState)
        }
      }, ApplicationEvent.LocalDataLoaded),
    )
  }

  persistValuesToStorage = () => {
    const valuesToPersist = this.getPersistableState()
    this.application.setValue(this.persistenceKey, valuesToPersist)
  }

  private getPersistedStateFromStorage = (): PersistableState => {
    return this.application.getValue(this.persistenceKey) as PersistableState
  }

  override deinit(): void {
    super.deinit()
  }
}
