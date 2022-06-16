import { storage, StorageKey } from '@/Services/LocalStorage'
import { WebApplication } from '@/Application/Application'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { destroyAllObjectProperties } from '@/Utils'
import { ApplicationEvent, DeinitSource, WebOrDesktopDeviceInterface, InternalEventBus } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { ActionsMenuController } from '../Controllers/ActionsMenuController'
import { FeaturesController } from '../Controllers/FeaturesController'
import { FilesController } from '../Controllers/FilesController'
import { NotesController } from '../Controllers/NotesController'
import { ItemListController } from '../Controllers/ItemList/ItemListController'
import { NoteTagsController } from '../Controllers/NoteTagsController'
import { NoAccountWarningController } from '../Controllers/NoAccountWarningController'
import { PreferencesController } from '../Controllers/PreferencesController'
import { PurchaseFlowController } from '../Controllers/PurchaseFlow/PurchaseFlowController'
import { QuickSettingsController } from '../Controllers/QuickSettingsController'
import { SearchOptionsController } from '../Controllers/SearchOptionsController'
import { SubscriptionController } from '../Controllers/Subscription/SubscriptionController'
import { SyncStatusController } from '../Controllers/SyncStatusController'
import { NavigationController } from '../Controllers/Navigation/NavigationController'
import { FilePreviewModalController } from '../Controllers/FilePreviewModalController'
import { SelectedItemsController } from '../Controllers/SelectedItemsController'
import { HistoryModalController } from '../Controllers/HistoryModalController'

export class ViewControllerManager {
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
  readonly noteTagsController: NoteTagsController
  readonly preferencesController = new PreferencesController()
  readonly purchaseFlowController: PurchaseFlowController
  readonly quickSettingsMenuController = new QuickSettingsController()
  readonly searchOptionsController: SearchOptionsController
  readonly subscriptionController: SubscriptionController
  readonly syncStatusController = new SyncStatusController()
  readonly navigationController: NavigationController
  readonly selectionController: SelectedItemsController
  readonly historyModalController: HistoryModalController

  public isSessionsModalVisible = false

  private appEventObserverRemovers: (() => void)[] = []
  private eventBus: InternalEventBus

  constructor(public application: WebApplication, private device: WebOrDesktopDeviceInterface) {
    this.eventBus = new InternalEventBus()

    this.selectionController = new SelectedItemsController(application, this.eventBus)

    this.noteTagsController = new NoteTagsController(application, this.eventBus)

    this.featuresController = new FeaturesController(application, this.eventBus)

    this.navigationController = new NavigationController(application, this.featuresController, this.eventBus)

    this.notesController = new NotesController(
      application,
      this.selectionController,
      this.noteTagsController,
      this.navigationController,
      this.eventBus,
    )

    this.searchOptionsController = new SearchOptionsController(application, this.eventBus)

    this.itemListController = new ItemListController(
      application,
      this.navigationController,
      this.searchOptionsController,
      this.selectionController,
      this.notesController,
      this.noteTagsController,
      this.eventBus,
    )

    this.notesController.setServicesPostConstruction(this.itemListController)
    this.noteTagsController.setServicesPostConstruction(this.itemListController)
    this.selectionController.setServicesPostConstruction(this.itemListController)

    this.noAccountWarningController = new NoAccountWarningController(application, this.eventBus)

    this.accountMenuController = new AccountMenuController(application, this.eventBus)

    this.subscriptionController = new SubscriptionController(application, this.eventBus)

    this.purchaseFlowController = new PurchaseFlowController(application, this.eventBus)

    this.filesController = new FilesController(
      application,
      this.notesController,
      this.filePreviewModalController,
      this.eventBus,
    )

    this.historyModalController = new HistoryModalController(this.application, this.eventBus, this.selectionController)

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

    this.noteTagsController.deinit()
    ;(this.noteTagsController as unknown) = undefined

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

    destroyAllObjectProperties(this)
  }

  openSessionsModal(): void {
    this.isSessionsModalVisible = true
  }

  closeSessionsModal(): void {
    this.isSessionsModalVisible = false
  }

  addAppEventObserver() {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      switch (eventName) {
        case ApplicationEvent.Launched:
          if (window.location.search.includes('purchase=true')) {
            this.purchaseFlowController.openPurchaseFlow()
          }
          break
        case ApplicationEvent.SyncStatusChanged:
          this.syncStatusController.update(this.application.sync.getSyncStatus())
          break
      }
    })
  }
}
