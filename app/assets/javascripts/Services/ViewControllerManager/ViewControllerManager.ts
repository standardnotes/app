import { storage, StorageKey } from '@/Services/LocalStorage'
import { WebApplication, WebAppEvent } from '@/Application/Application'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { destroyAllObjectProperties, isDesktopApplication } from '@/Utils'
import {
  ApplicationEvent,
  ContentType,
  DeinitSource,
  PrefKey,
  SNTag,
  removeFromArray,
  WebOrDesktopDeviceInterface,
} from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { ActionsMenuController } from '../../Controllers/ActionsMenuController'
import { FeaturesController } from '../../Controllers/FeaturesController'
import { FilesController } from '../../Controllers/FilesController'
import { NotesController } from '../../Controllers/NotesController'
import { ItemListController } from '../../Controllers/ItemList/ItemListController'
import { NoteTagsController } from '../../Controllers/NoteTagsController'
import { NoAccountWarningController } from '../../Controllers/NoAccountWarningController'
import { PreferencesController } from '../../Controllers/PreferencesController'
import { PurchaseFlowController } from '../../Controllers/PurchaseFlow/PurchaseFlowController'
import { QuickSettingsController } from '../../Controllers/QuickSettingsController'
import { SearchOptionsController } from '../../Controllers/SearchOptionsController'
import { SubscriptionController } from '../../Controllers/Subscription/SubscriptionController'
import { SyncStatusController } from '../../Controllers/SyncStatusController'
import { TagsController } from '../../Controllers/Navigation/TagsController'
import { FilePreviewModalController } from '../../Controllers/FilePreviewModalController'
import { SelectedItemsController } from '../../Controllers/SelectedItemsController'
import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { ViewControllerManagerEvent } from './ViewControllerManagerEvent'
import { EditorEventSource } from '../../Typings/EditorEventSource'
import { PanelResizedData } from '../../Typings/PanelResizedData'

type ObserverCallback = (event: ViewControllerManagerEvent, data?: unknown) => Promise<void>

export class ViewControllerManager {
  readonly enableUnfinishedFeatures: boolean = window?.enabledUnfinishedFeatures

  observers: ObserverCallback[] = []
  locked = true
  unsubAppEventObserver!: () => void
  webAppEventDisposer?: () => void
  onVisibilityChange: () => void
  showBetaWarning: boolean
  dealloced = false

  readonly accountMenuController: AccountMenuController
  readonly actionsMenuController = new ActionsMenuController()
  readonly featuresController: FeaturesController
  readonly filePreviewModalController = new FilePreviewModalController()
  readonly filesController: FilesController
  readonly noAccountWarningController: NoAccountWarningController
  readonly notesController: NotesController
  readonly contentListController: ItemListController
  readonly noteTagsController: NoteTagsController
  readonly preferencesController = new PreferencesController()
  readonly purchaseFlowController: PurchaseFlowController
  readonly quickSettingsMenuController = new QuickSettingsController()
  readonly searchOptionsController: SearchOptionsController
  readonly subscriptionController: SubscriptionController
  readonly syncStatusController = new SyncStatusController()
  readonly navigationController: TagsController
  readonly selectionController: SelectedItemsController

  isSessionsModalVisible = false

  private appEventObserverRemovers: (() => void)[] = []

  constructor(public application: WebApplication, private device: WebOrDesktopDeviceInterface) {
    this.selectionController = new SelectedItemsController(application, this, this.appEventObserverRemovers)
    this.notesController = new NotesController(
      application,
      this,
      async () => {
        await this.notifyEvent(ViewControllerManagerEvent.ActiveEditorChanged)
      },
      this.appEventObserverRemovers,
    )
    this.featuresController = new FeaturesController(application, this.appEventObserverRemovers)
    this.navigationController = new TagsController(
      application,
      this,
      this.appEventObserverRemovers,
      this.featuresController,
    )
    this.searchOptionsController = new SearchOptionsController(application, this.appEventObserverRemovers)
    this.contentListController = new ItemListController(application, this, this.appEventObserverRemovers)
    this.noteTagsController = new NoteTagsController(application, this, this.appEventObserverRemovers)
    this.noAccountWarningController = new NoAccountWarningController(application, this.appEventObserverRemovers)
    this.accountMenuController = new AccountMenuController(application, this.appEventObserverRemovers)
    this.subscriptionController = new SubscriptionController(application, this.appEventObserverRemovers)
    this.purchaseFlowController = new PurchaseFlowController(application)
    this.filesController = new FilesController(application, this, this.appEventObserverRemovers)
    this.addAppEventObserver()
    this.onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      const event = visible ? ViewControllerManagerEvent.WindowDidFocus : ViewControllerManagerEvent.WindowDidBlur
      this.notifyEvent(event).catch(console.error)
    }
    this.registerVisibilityObservers()

    if (this.device.appVersion.includes('-beta')) {
      this.showBetaWarning = storage.get(StorageKey.ShowBetaWarning) ?? true
    } else {
      this.showBetaWarning = false
    }

    makeObservable(this, {
      showBetaWarning: observable,
      isSessionsModalVisible: observable,
      preferencesController: observable,

      enableBetaWarning: action,
      disableBetaWarning: action,
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
    this.observers.length = 0

    this.appEventObserverRemovers.forEach((remover) => remover())
    this.appEventObserverRemovers.length = 0
    ;(this.device as unknown) = undefined

    this.webAppEventDisposer?.()
    this.webAppEventDisposer = undefined
    ;(this.filePreviewModalController as unknown) = undefined
    ;(this.preferencesController as unknown) = undefined
    ;(this.quickSettingsMenuController as unknown) = undefined
    ;(this.syncStatusController as unknown) = undefined

    this.actionsMenuController.reset()
    ;(this.actionsMenuController as unknown) = undefined

    this.featuresController.deinit(source)
    ;(this.featuresController as unknown) = undefined

    this.accountMenuController.deinit(source)
    ;(this.accountMenuController as unknown) = undefined

    this.filesController.deinit(source)
    ;(this.filesController as unknown) = undefined

    this.noAccountWarningController.deinit(source)
    ;(this.noAccountWarningController as unknown) = undefined

    this.notesController.deinit(source)
    ;(this.notesController as unknown) = undefined

    this.contentListController.deinit(source)
    ;(this.contentListController as unknown) = undefined

    this.noteTagsController.deinit(source)
    ;(this.noteTagsController as unknown) = undefined

    this.purchaseFlowController.deinit(source)
    ;(this.purchaseFlowController as unknown) = undefined

    this.searchOptionsController.deinit(source)
    ;(this.searchOptionsController as unknown) = undefined

    this.subscriptionController.deinit(source)
    ;(this.subscriptionController as unknown) = undefined

    this.navigationController.deinit(source)
    ;(this.navigationController as unknown) = undefined

    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    ;(this.onVisibilityChange as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  openSessionsModal(): void {
    this.isSessionsModalVisible = true
  }

  closeSessionsModal(): void {
    this.isSessionsModalVisible = false
  }

  disableBetaWarning() {
    this.showBetaWarning = false
    storage.set(StorageKey.ShowBetaWarning, false)
  }

  enableBetaWarning() {
    this.showBetaWarning = true
    storage.set(StorageKey.ShowBetaWarning, true)
  }

  public get version(): string {
    return this.device.appVersion
  }

  isGlobalSpellcheckEnabled(): boolean {
    return this.application.getPreference(PrefKey.EditorSpellcheck, true)
  }

  async toggleGlobalSpellcheck() {
    const currentValue = this.isGlobalSpellcheckEnabled()
    return this.application.setPreference(PrefKey.EditorSpellcheck, !currentValue)
  }

  addAppEventObserver() {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      switch (eventName) {
        case ApplicationEvent.Started:
          this.locked = true
          break
        case ApplicationEvent.Launched:
          this.locked = false
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

  isLocked() {
    return this.locked
  }

  registerVisibilityObservers() {
    if (isDesktopApplication()) {
      this.webAppEventDisposer = this.application.addWebEventObserver((event) => {
        if (event === WebAppEvent.DesktopWindowGainedFocus) {
          this.notifyEvent(ViewControllerManagerEvent.WindowDidFocus).catch(console.error)
        } else if (event === WebAppEvent.DesktopWindowLostFocus) {
          this.notifyEvent(ViewControllerManagerEvent.WindowDidBlur).catch(console.error)
        }
      })
    } else {
      /* Tab visibility listener, web only */
      document.addEventListener('visibilitychange', this.onVisibilityChange)
    }
  }

  addObserver(callback: ObserverCallback): () => void {
    this.observers.push(callback)

    const thislessObservers = this.observers
    return () => {
      removeFromArray(thislessObservers, callback)
    }
  }

  async notifyEvent(eventName: ViewControllerManagerEvent, data?: unknown) {
    for (const callback of this.observers) {
      await callback(eventName, data)
    }
  }

  /** Returns the tags that are referncing this note */
  public getItemTags(item: ListableContentItem) {
    return this.application.items.itemsReferencingItem(item).filter((ref) => {
      return ref.content_type === ContentType.Tag
    }) as SNTag[]
  }

  panelDidResize(name: string, collapsed: boolean) {
    const data: PanelResizedData = {
      panel: name,
      collapsed: collapsed,
    }
    this.notifyEvent(ViewControllerManagerEvent.PanelResized, data).catch(console.error)
  }

  editorDidFocus(eventSource: EditorEventSource) {
    this.notifyEvent(ViewControllerManagerEvent.EditorFocused, { eventSource: eventSource }).catch(console.error)
  }

  beganBackupDownload() {
    this.notifyEvent(ViewControllerManagerEvent.BeganBackupDownload).catch(console.error)
  }

  endedBackupDownload(success: boolean) {
    this.notifyEvent(ViewControllerManagerEvent.EndedBackupDownload, { success: success }).catch(console.error)
  }
}
