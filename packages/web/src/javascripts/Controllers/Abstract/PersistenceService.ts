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
import { PersistedStateValue, PersistenceKey, StorageKey } from '@standardnotes/ui-services'
import { CrossControllerEvent } from '../CrossControllerEvent'
import { NavigationController } from '../Navigation/NavigationController'
import { ItemListController } from '../ItemList/ItemListController'

export class PersistenceService implements InternalEventHandlerInterface {
  private didHydrateOnce = false

  constructor(
    private itemListController: ItemListController,
    private navigationController: NavigationController,
    private storage: StorageServiceInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private eventBus: InternalEventBusInterface,
  ) {
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataLoaded)
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataIncrementalLoad)
    eventBus.addEventHandler(this, CrossControllerEvent.HydrateFromPersistedValues)
    eventBus.addEventHandler(this, CrossControllerEvent.RequestValuePersistence)
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

      case CrossControllerEvent.HydrateFromPersistedValues: {
        this.hydrateFromPersistedValues(event.payload as PersistedStateValue | undefined)
        break
      }

      case CrossControllerEvent.RequestValuePersistence: {
        this.persistCurrentState()
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

  persistCurrentState(): void {
    const values: PersistedStateValue = {
      [PersistenceKey.ItemListController]: this.itemListController.getPersistableValue(),
      [PersistenceKey.NavigationController]: this.navigationController.getPersistableValue(),
    }

    this.persistValues(values)

    const selectedItemsState = values['selected-items-controller']
    const navigationSelectionState = values['navigation-controller']
    const launchPriorityUuids: string[] = []
    if (selectedItemsState.selectedUuids.length) {
      launchPriorityUuids.push(...selectedItemsState.selectedUuids)
    }
    if (navigationSelectionState.selectedTagUuid) {
      launchPriorityUuids.push(navigationSelectionState.selectedTagUuid)
    }

    this.sync.setLaunchPriorityUuids(launchPriorityUuids)
  }

  hydrateFromPersistedValues(values: PersistedStateValue | undefined): void {
    const navigationState = values?.[PersistenceKey.NavigationController]
    this.navigationController.hydrateFromPersistedValue(navigationState)

    const selectedItemsState = values?.[PersistenceKey.ItemListController]
    this.itemListController.hydrateFromPersistedValue(selectedItemsState)
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
