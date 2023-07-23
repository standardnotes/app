import { PaneController } from './PaneController/PaneController'
import {
  PersistedStateValue,
  PersistenceKey,
  storage,
  StorageKey,
  ToastService,
  ToastServiceInterface,
} from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/WebApplication'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { destroyAllObjectProperties } from '@/Utils'
import {
  DeinitSource,
  WebOrDesktopDeviceInterface,
  SubscriptionManagerInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
} from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { ActionsMenuController } from './ActionsMenuController'
import { FeaturesController } from './FeaturesController'
import { FilesController } from './FilesController'
import { NotesController } from './NotesController/NotesController'
import { ItemListController } from './ItemList/ItemListController'
import { NoAccountWarningController } from './NoAccountWarningController'
import { PreferencesController } from './PreferencesController'
import { PurchaseFlowController } from './PurchaseFlow/PurchaseFlowController'
import { QuickSettingsController } from './QuickSettingsController'
import { SearchOptionsController } from './SearchOptionsController'
import { SubscriptionController } from './Subscription/SubscriptionController'
import { SyncStatusController } from './SyncStatusController'
import { NavigationController } from './Navigation/NavigationController'
import { FilePreviewModalController } from './FilePreviewModalController'
import { SelectedItemsController } from './SelectedItemsController'
import { HistoryModalController } from './NoteHistory/HistoryModalController'
import { LinkingController } from './LinkingController'
import { PersistenceService } from './Abstract/PersistenceService'
import { CrossControllerEvent } from './CrossControllerEvent'
import { EventObserverInterface } from '@/Event/EventObserverInterface'
import { ApplicationEventObserver } from '@/Event/ApplicationEventObserver'
import { ImportModalController } from './ImportModalController'
import { VaultSelectionMenuController } from './VaultSelectionMenuController'

export class ViewControllerManager implements InternalEventHandlerInterface {
  readonly enableUnfinishedFeatures: boolean = window?.enabledUnfinishedFeatures

  private unsubAppEventObserver!: () => void
  showBetaWarning: boolean
  public dealloced = false

  readonly accountMenuController: AccountMenuController
  readonly actionsMenuController = new ActionsMenuController()
  readonly featuresController: FeaturesController
  readonly filePreviewModalController: FilePreviewModalController
  readonly filesController: FilesController
  readonly noAccountWarningController: NoAccountWarningController
  readonly notesController: NotesController
  readonly itemListController: ItemListController
  readonly preferencesController: PreferencesController
  readonly purchaseFlowController: PurchaseFlowController
  readonly quickSettingsMenuController: QuickSettingsController
  readonly vaultSelectionController: VaultSelectionMenuController
  readonly searchOptionsController: SearchOptionsController
  readonly subscriptionController: SubscriptionController
  readonly syncStatusController = new SyncStatusController()
  readonly navigationController: NavigationController
  readonly selectionController: SelectedItemsController
  readonly historyModalController: HistoryModalController
  readonly linkingController: LinkingController
  readonly paneController: PaneController
  readonly importModalController: ImportModalController

  public isSessionsModalVisible = false

  private appEventObserverRemovers: (() => void)[] = []

  private subscriptionManager: SubscriptionManagerInterface
  private persistenceService: PersistenceService
  private applicationEventObserver: EventObserverInterface
  private toastService: ToastServiceInterface

  constructor(public application: WebApplication, private device: WebOrDesktopDeviceInterface) {
    const eventBus = application.events

    this.persistenceService = new PersistenceService(application, eventBus)

    eventBus.addEventHandler(this, CrossControllerEvent.HydrateFromPersistedValues)
    eventBus.addEventHandler(this, CrossControllerEvent.RequestValuePersistence)

    this.subscriptionManager = application.subscriptions

    this.filePreviewModalController = new FilePreviewModalController(application)

    this.quickSettingsMenuController = new QuickSettingsController(application, eventBus)

    this.vaultSelectionController = new VaultSelectionMenuController(application, eventBus)

    this.paneController = new PaneController(application, eventBus)

    this.preferencesController = new PreferencesController(application, eventBus)

    this.selectionController = new SelectedItemsController(application, eventBus)

    this.featuresController = new FeaturesController(application, eventBus)

    this.navigationController = new NavigationController(application, this.featuresController, eventBus)

    this.notesController = new NotesController(
      application,
      this.selectionController,
      this.navigationController,
      eventBus,
    )

    this.searchOptionsController = new SearchOptionsController(application, eventBus)

    this.linkingController = new LinkingController(
      application,
      this.navigationController,
      this.selectionController,
      eventBus,
    )

    this.itemListController = new ItemListController(
      application,
      this.navigationController,
      this.searchOptionsController,
      this.selectionController,
      this.notesController,
      eventBus,
    )

    this.notesController.setServicesPostConstruction(this.itemListController)
    this.selectionController.setServicesPostConstruction(this.itemListController)

    this.noAccountWarningController = new NoAccountWarningController(application, eventBus)

    this.accountMenuController = new AccountMenuController(application, eventBus)

    this.subscriptionController = new SubscriptionController(application, eventBus, this.subscriptionManager)

    this.purchaseFlowController = new PurchaseFlowController(application, eventBus)

    this.filesController = new FilesController(
      application,
      this.notesController,
      this.filePreviewModalController,
      eventBus,
    )

    this.linkingController.setServicesPostConstruction(
      this.itemListController,
      this.filesController,
      this.subscriptionController,
    )

    this.historyModalController = new HistoryModalController(this.application, eventBus, this.notesController)

    this.importModalController = new ImportModalController(this.application, this.navigationController)

    this.toastService = new ToastService()

    this.applicationEventObserver = new ApplicationEventObserver(
      application,
      application.routeService,
      this.purchaseFlowController,
      this.accountMenuController,
      this.preferencesController,
      this.syncStatusController,
      application.sync,
      application.sessions,
      application.subscriptions,
      this.toastService,
      application.user,
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
    this.filePreviewModalController.deinit()
    ;(this.filePreviewModalController as unknown) = undefined
    ;(this.preferencesController as unknown) = undefined
    ;(this.quickSettingsMenuController as unknown) = undefined
    ;(this.vaultSelectionController as unknown) = undefined
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

  openSessionsModal = () => {
    this.isSessionsModalVisible = true
  }

  closeSessionsModal = () => {
    this.isSessionsModalVisible = false
  }

  addAppEventObserver() {
    this.unsubAppEventObserver = this.application.addEventObserver(
      this.applicationEventObserver.handle.bind(this.applicationEventObserver),
    )
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
    this.application.sync.setLaunchPriorityUuids(launchPriorityUuids)
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
