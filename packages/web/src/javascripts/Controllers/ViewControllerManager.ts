import { PaneController } from './PaneController'
import { storage, StorageKey } from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/Application'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { destroyAllObjectProperties } from '@/Utils'
import {
  DeinitSource,
  WebOrDesktopDeviceInterface,
  InternalEventBus,
  ItemCounterInterface,
  ItemCounter,
  SubscriptionClientInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
} from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { ActionsMenuController } from './ActionsMenuController'
import { FeaturesController } from './FeaturesController'
import { FilesController } from './FilesController'
import { NotesController } from './NotesController'
import { ItemListController, ItemListControllerPersistableValue } from './ItemList/ItemListController'
import { NoAccountWarningController } from './NoAccountWarningController'
import { PreferencesController } from './PreferencesController'
import { PurchaseFlowController } from './PurchaseFlow/PurchaseFlowController'
import { QuickSettingsController } from './QuickSettingsController'
import { SearchOptionsController } from './SearchOptionsController'
import { SubscriptionController } from './Subscription/SubscriptionController'
import { SyncStatusController } from './SyncStatusController'
import { NavigationController, NavigationControllerPersistableValue } from './Navigation/NavigationController'
import { FilePreviewModalController } from './FilePreviewModalController'
import { SelectedItemsController, SelectionControllerPersistableValue } from './SelectedItemsController'
import { HistoryModalController } from './NoteHistory/HistoryModalController'
import { LinkingController } from './LinkingController'
import { MasterPersistedValue, PersistenceKey, PersistenceService } from './Abstract/PersistenceService'
import { CrossControllerEvent } from './CrossControllerEvent'
import { EventObserverInterface } from '@/Event/EventObserverInterface'
import { ApplicationEventObserver } from '@/Event/ApplicationEventObserver'

export class ViewControllerManager implements InternalEventHandlerInterface {
  readonly enableUnfinishedFeatures: boolean = window?.enabledUnfinishedFeatures

  private unsubAppEventObserver!: () => void
  showBetaWarning: boolean
  public dealloced = false

  readonly accountMenuController: AccountMenuController
  readonly actionsMenuController = new ActionsMenuController()
  readonly featuresController: FeaturesController
  readonly filePreviewModalController = new FilePreviewModalController()
  readonly filesController: FilesController
  readonly noAccountWarningController: NoAccountWarningController
  readonly notesController: NotesController
  readonly itemListController: ItemListController
  readonly preferencesController: PreferencesController
  readonly purchaseFlowController: PurchaseFlowController
  readonly quickSettingsMenuController = new QuickSettingsController()
  readonly searchOptionsController: SearchOptionsController
  readonly subscriptionController: SubscriptionController
  readonly syncStatusController = new SyncStatusController()
  readonly navigationController: NavigationController
  readonly selectionController: SelectedItemsController
  readonly historyModalController: HistoryModalController
  readonly linkingController: LinkingController
  readonly paneController: PaneController

  public isSessionsModalVisible = false

  private appEventObserverRemovers: (() => void)[] = []
  private eventBus: InternalEventBus
  private itemCounter: ItemCounterInterface
  private subscriptionManager: SubscriptionClientInterface
  private persistenceService: PersistenceService
  private applicationEventObserver: EventObserverInterface

  constructor(public application: WebApplication, private device: WebOrDesktopDeviceInterface) {
    this.eventBus = new InternalEventBus()

    this.persistenceService = new PersistenceService(application, this.eventBus)

    this.eventBus.addEventHandler(this, CrossControllerEvent.HydrateFromPersistedValues)
    this.eventBus.addEventHandler(this, CrossControllerEvent.RequestValuePersistence)

    this.itemCounter = new ItemCounter()

    this.subscriptionManager = application.subscriptions

    this.paneController = new PaneController()

    this.preferencesController = new PreferencesController(application, this.eventBus)

    this.selectionController = new SelectedItemsController(application, this.eventBus)

    this.featuresController = new FeaturesController(application, this.eventBus)

    this.navigationController = new NavigationController(application, this.featuresController, this.eventBus)

    this.notesController = new NotesController(
      application,
      this.selectionController,
      this.navigationController,
      this.eventBus,
    )

    this.searchOptionsController = new SearchOptionsController(application, this.eventBus)

    this.linkingController = new LinkingController(
      application,
      this.navigationController,
      this.selectionController,
      this.eventBus,
    )

    this.itemListController = new ItemListController(
      application,
      this.navigationController,
      this.searchOptionsController,
      this.selectionController,
      this.notesController,
      this.linkingController,
      this.eventBus,
    )

    this.notesController.setServicesPostConstruction(this.itemListController)
    this.selectionController.setServicesPostConstruction(this.itemListController)

    this.noAccountWarningController = new NoAccountWarningController(application, this.eventBus)

    this.accountMenuController = new AccountMenuController(application, this.eventBus, this.itemCounter)

    this.subscriptionController = new SubscriptionController(application, this.eventBus, this.subscriptionManager)

    this.purchaseFlowController = new PurchaseFlowController(application, this.eventBus)

    this.filesController = new FilesController(
      application,
      this.notesController,
      this.filePreviewModalController,
      this.eventBus,
    )

    this.linkingController.setServicesPostConstruction(
      this.itemListController,
      this.filesController,
      this.subscriptionController,
    )

    this.historyModalController = new HistoryModalController(this.application, this.eventBus)

    this.applicationEventObserver = new ApplicationEventObserver(
      application,
      application.routeService,
      this.purchaseFlowController,
      this.accountMenuController,
      this.preferencesController,
      this.syncStatusController,
      application.sync,
      application.sessions,
    )

    this.addAppEventObserver()

    if (this.device.appVersion.includes('-beta')) {
      this.showBetaWarning = storage.get(StorageKey.ShowBetaWarning) ?? true
    } else {
      this.showBetaWarning = false
    }

    makeObservable(this, {
      showBetaWarning: observable,
      isSessionsModalVisible: observable,
      preferencesController: observable,

      openSessionsModal: action,
      closeSessionsModal: action,
    })
  }

  deinit(source: DeinitSource): void {
    this.dealloced = true
    ;(this.application as unknown) = undefined

    if (source === DeinitSource.SignOut) {
      storage.remove(StorageKey.ShowBetaWarning)
      this.noAccountWarningController.reset()
    }

    this.unsubAppEventObserver?.()
    ;(this.unsubAppEventObserver as unknown) = undefined

    this.appEventObserverRemovers.forEach((remover) => remover())
    this.appEventObserverRemovers.length = 0
    ;(this.device as unknown) = undefined
    ;(this.filePreviewModalController as unknown) = undefined
    ;(this.preferencesController as unknown) = undefined
    ;(this.quickSettingsMenuController as unknown) = undefined
    ;(this.syncStatusController as unknown) = undefined

    this.persistenceService.deinit()
    ;(this.persistenceService as unknown) = undefined

    this.actionsMenuController.reset()
    ;(this.actionsMenuController as unknown) = undefined

    this.featuresController.deinit()
    ;(this.featuresController as unknown) = undefined

    this.accountMenuController.deinit()
    ;(this.accountMenuController as unknown) = undefined

    this.filesController.deinit()
    ;(this.filesController as unknown) = undefined

    this.noAccountWarningController.deinit()
    ;(this.noAccountWarningController as unknown) = undefined

    this.notesController.deinit()
    ;(this.notesController as unknown) = undefined

    this.itemListController.deinit()
    ;(this.itemListController as unknown) = undefined

    this.linkingController.deinit()
    ;(this.linkingController as unknown) = undefined

    this.purchaseFlowController.deinit()
    ;(this.purchaseFlowController as unknown) = undefined

    this.searchOptionsController.deinit()
    ;(this.searchOptionsController as unknown) = undefined

    this.subscriptionController.deinit()
    ;(this.subscriptionController as unknown) = undefined

    this.navigationController.deinit()
    ;(this.navigationController as unknown) = undefined

    this.historyModalController.deinit()
    ;(this.historyModalController as unknown) = undefined

    this.paneController.deinit()
    ;(this.paneController as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  openSessionsModal(): void {
    this.isSessionsModalVisible = true
  }

  closeSessionsModal(): void {
    this.isSessionsModalVisible = false
  }

  addAppEventObserver() {
    this.unsubAppEventObserver = this.application.addEventObserver(
      this.applicationEventObserver.handle.bind(this.applicationEventObserver),
    )
  }

  persistValues = (): void => {
    const values: MasterPersistedValue = {
      [PersistenceKey.SelectedItemsController]: this.selectionController.getPersistableValue(),
      [PersistenceKey.NavigationController]: this.navigationController.getPersistableValue(),
      [PersistenceKey.ItemListController]: this.itemListController.getPersistableValue(),
    }

    this.persistenceService.persistValues(values)
  }

  hydrateFromPersistedValues = (values: MasterPersistedValue | undefined): void => {
    const itemListState = values?.[PersistenceKey.ItemListController] as ItemListControllerPersistableValue
    this.itemListController.hydrateFromPersistedValue(itemListState)

    const selectedItemsState = values?.[PersistenceKey.SelectedItemsController] as SelectionControllerPersistableValue
    this.selectionController.hydrateFromPersistedValue(selectedItemsState)

    const navigationState = values?.[PersistenceKey.NavigationController] as NavigationControllerPersistableValue
    this.navigationController.hydrateFromPersistedValue(navigationState)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === CrossControllerEvent.HydrateFromPersistedValues) {
      this.hydrateFromPersistedValues(event.payload as MasterPersistedValue | undefined)
    } else if (event.type === CrossControllerEvent.RequestValuePersistence) {
      this.persistValues()
    }
  }
}
