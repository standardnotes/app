import { PersistedStateValue, PersistenceKey } from '@standardnotes/ui-services'
import { destroyAllObjectProperties } from '@/Utils'
import {
  InternalEventHandlerInterface,
  InternalEventInterface,
  InternalEventBusInterface,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { CrossControllerEvent } from './CrossControllerEvent'
import { SelectedItemsController } from './SelectedItemsController'
import { NavigationController } from './Navigation/NavigationController'
import { PersistenceService } from './Abstract/PersistenceService'

export class ViewControllerManager implements InternalEventHandlerInterface {
  readonly enableUnfinishedFeatures: boolean = window?.enabledUnfinishedFeatures
  private appEventObserverRemovers: (() => void)[] = []
  public dealloced = false

  constructor(
    private persistenceService: PersistenceService,
    private selectionController: SelectedItemsController,
    private navigationController: NavigationController,
    private sync: SyncServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    eventBus.addEventHandler(this, CrossControllerEvent.HydrateFromPersistedValues)
    eventBus.addEventHandler(this, CrossControllerEvent.RequestValuePersistence)
  }

  deinit(): void {
    this.dealloced = true

    this.appEventObserverRemovers.forEach((remover) => remover())
    this.appEventObserverRemovers.length = 0

    destroyAllObjectProperties(this)
  }

  persistValues = (): void => {
    const values: PersistedStateValue = {
      [PersistenceKey.SelectedItemsController]: this.selectionController.getPersistableValue(),
      [PersistenceKey.NavigationController]: this.navigationController.getPersistableValue(),
    }

    this.persistenceService.persistValues(values)

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

  clearPersistedValues = (): void => {
    this.persistenceService.clearPersistedValues()
  }

  hydrateFromPersistedValues = (values: PersistedStateValue | undefined): void => {
    const navigationState = values?.[PersistenceKey.NavigationController]
    this.navigationController.hydrateFromPersistedValue(navigationState)

    const selectedItemsState = values?.[PersistenceKey.SelectedItemsController]
    this.selectionController.hydrateFromPersistedValue(selectedItemsState)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === CrossControllerEvent.HydrateFromPersistedValues) {
      this.hydrateFromPersistedValues(event.payload as PersistedStateValue | undefined)
    } else if (event.type === CrossControllerEvent.RequestValuePersistence) {
      this.persistValues()
    }
  }
}
