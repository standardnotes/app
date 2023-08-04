import {
  ArchiveManager,
  AutolockService,
  ChangelogService,
  Importer,
  IsGlobalSpellcheckEnabled,
  IsNativeIOS,
  IsNativeMobileWeb,
  KeyboardService,
  RouteService,
  ThemeManager,
  ToastService,
  VaultDisplayService,
  WebApplicationInterface,
} from '@standardnotes/ui-services'
import { DependencyContainer } from './Dependencies'
import { Web_TYPES } from './Types'
import { BackupServiceInterface, isDesktopDevice } from '@standardnotes/snjs'
import { DesktopManager } from '../Device/DesktopManager'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { MomentsService } from '@/Controllers/Moments/MomentsService'
import { PersistenceService } from '@/Controllers/Abstract/PersistenceService'
import { FilePreviewModalController } from '@/Controllers/FilePreviewModalController'
import { QuickSettingsController } from '@/Controllers/QuickSettingsController'
import { VaultSelectionMenuController } from '@/Controllers/VaultSelectionMenuController'
import { PaneController } from '@/Controllers/PaneController/PaneController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { NoAccountWarningController } from '@/Controllers/NoAccountWarningController'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { PurchaseFlowController } from '@/Controllers/PurchaseFlow/PurchaseFlowController'
import { FilesController } from '@/Controllers/FilesController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import { ImportModalController } from '@/Controllers/ImportModalController'
import { ApplicationEventObserver } from '@/Event/ApplicationEventObserver'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { LinkingController } from '@/Controllers/LinkingController'
import { SyncStatusController } from '@/Controllers/SyncStatusController'
import { ActionsMenuController } from '@/Controllers/ActionsMenuController'
import { ItemGroupController } from '@/Components/NoteView/Controller/ItemGroupController'
import { MobileWebReceiver } from '@/NativeMobileWeb/MobileWebReceiver'
import { AndroidBackHandler } from '@/NativeMobileWeb/AndroidBackHandler'

export class WebDependencies extends DependencyContainer {
  constructor(private application: WebApplicationInterface) {
    super()

    this.bind(Web_TYPES.Importer, () => {
      return new Importer(application)
    })

    this.bind(Web_TYPES.IsNativeIOS, () => {
      return new IsNativeIOS(application.environment, application.platform)
    })

    this.bind(Web_TYPES.IsNativeMobileWeb, () => {
      return new IsNativeMobileWeb(application.environment)
    })

    this.bind(Web_TYPES.IsGlobalSpellcheckEnabled, () => {
      return new IsGlobalSpellcheckEnabled(application.preferences)
    })

    if (application.isNativeMobileWeb()) {
      this.bind(Web_TYPES.MobileWebReceiver, () => {
        return new MobileWebReceiver(application)
      })

      this.bind(Web_TYPES.AndroidBackHandler, () => {
        return new AndroidBackHandler()
      })
    }

    this.bind(Web_TYPES.Application, () => this.application)

    this.bind(Web_TYPES.ItemGroupController, () => {
      return new ItemGroupController(this.application)
    })

    this.bind(Web_TYPES.RouteService, () => {
      return new RouteService(this.application, this.application.events)
    })

    this.bind(Web_TYPES.KeyboardService, () => {
      return new KeyboardService(application.platform, application.environment)
    })

    this.bind(Web_TYPES.ArchiveManager, () => {
      return new ArchiveManager(this.get<WebApplicationInterface>(Web_TYPES.Application))
    })

    this.bind(Web_TYPES.ThemeManager, () => {
      return new ThemeManager(application, application.preferences, application.componentManager, application.events)
    })

    this.bind(Web_TYPES.AutolockService, () => {
      return application.isNativeMobileWeb() ? undefined : new AutolockService(application, application.events)
    })

    this.bind(Web_TYPES.DesktopManager, () => {
      return isDesktopDevice(application.device)
        ? new DesktopManager(application, application.device, application.fileBackups as BackupServiceInterface)
        : undefined
    })

    this.bind(Web_TYPES.ViewControllerManager, () => {
      return new ViewControllerManager(
        this.get<PersistenceService>(Web_TYPES.PersistenceService),
        this.get<SelectedItemsController>(Web_TYPES.SelectedItemsController),
        this.get<NavigationController>(Web_TYPES.NavigationController),
        application.sync,
        application.events,
      )
    })

    this.bind(Web_TYPES.ChangelogService, () => {
      return new ChangelogService(application.environment, application.storage)
    })

    this.bind(Web_TYPES.MomentsService, () => {
      return new MomentsService(
        application,
        this.get<FilesController>(Web_TYPES.FilesController),
        this.get<LinkingController>(Web_TYPES.LinkingController),
        application.events,
      )
    })

    this.bind(Web_TYPES.VaultDisplayService, () => {
      return new VaultDisplayService(application, application.events)
    })

    this.bind(Web_TYPES.PersistenceService, () => {
      return new PersistenceService(application, application.events)
    })

    this.bind(Web_TYPES.FilePreviewModalController, () => {
      return new FilePreviewModalController(application)
    })

    this.bind(Web_TYPES.QuickSettingsController, () => {
      return new QuickSettingsController(application, application.events)
    })

    this.bind(Web_TYPES.VaultSelectionMenuController, () => {
      return new VaultSelectionMenuController(application, application.events)
    })

    this.bind(Web_TYPES.PaneController, () => {
      return new PaneController(application, application.events)
    })

    this.bind(Web_TYPES.PreferencesController, () => {
      return new PreferencesController(application, application.events)
    })

    this.bind(Web_TYPES.SelectedItemsController, () => {
      return new SelectedItemsController(
        application,
        this.get<KeyboardService>(Web_TYPES.KeyboardService),
        this.get<PaneController>(Web_TYPES.PaneController),
        application.events,
      )
    })

    this.bind(Web_TYPES.FeaturesController, () => {
      return new FeaturesController(application, application.events)
    })

    this.bind(Web_TYPES.NavigationController, () => {
      return new NavigationController(
        application,
        this.get<FeaturesController>(Web_TYPES.FeaturesController),
        this.get<VaultDisplayService>(Web_TYPES.VaultDisplayService),
        this.get<KeyboardService>(Web_TYPES.KeyboardService),
        this.get<PaneController>(Web_TYPES.PaneController),
        application.sync,
        application.mutator,
        application.items,
        application.alerts,
        application.events,
      )
    })

    this.bind(Web_TYPES.NotesController, () => {
      return new NotesController(
        application,
        this.get<SelectedItemsController>(Web_TYPES.SelectedItemsController),
        this.get<NavigationController>(Web_TYPES.NavigationController),
        application.events,
      )
    })

    this.bind(Web_TYPES.SearchOptionsController, () => {
      return new SearchOptionsController(application, application.events)
    })

    this.bind(Web_TYPES.LinkingController, () => {
      return new LinkingController(
        application,
        this.get<NavigationController>(Web_TYPES.NavigationController),
        this.get<SelectedItemsController>(Web_TYPES.SelectedItemsController),
        application.events,
      )
    })

    this.bind(Web_TYPES.ItemListController, () => {
      return new ItemListController(
        application,
        this.get<NavigationController>(Web_TYPES.NavigationController),
        this.get<SearchOptionsController>(Web_TYPES.SearchOptionsController),
        this.get<SelectedItemsController>(Web_TYPES.SelectedItemsController),
        this.get<NotesController>(Web_TYPES.NotesController),
        application.events,
      )
    })

    this.bind(Web_TYPES.NoAccountWarningController, () => {
      return new NoAccountWarningController(application, application.events)
    })

    this.bind(Web_TYPES.AccountMenuController, () => {
      return new AccountMenuController(application, application.events)
    })

    this.bind(Web_TYPES.SubscriptionController, () => {
      return new SubscriptionController(application, application.events, application.subscriptions)
    })

    this.bind(Web_TYPES.PurchaseFlowController, () => {
      return new PurchaseFlowController(application, application.events)
    })

    this.bind(Web_TYPES.SyncStatusController, () => {
      return new SyncStatusController()
    })

    this.bind(Web_TYPES.ActionsMenuController, () => {
      return new ActionsMenuController()
    })

    this.bind(Web_TYPES.FilesController, () => {
      return new FilesController(
        application,
        this.get<NotesController>(Web_TYPES.NotesController),
        this.get<FilePreviewModalController>(Web_TYPES.FilePreviewModalController),
        application.events,
      )
    })

    this.bind(Web_TYPES.HistoryModalController, () => {
      return new HistoryModalController(
        this.application,
        application.events,
        this.get<NotesController>(Web_TYPES.NotesController),
      )
    })

    this.bind(Web_TYPES.ImportModalController, () => {
      return new ImportModalController(this.application, this.get<NavigationController>(Web_TYPES.NavigationController))
    })

    this.bind(Web_TYPES.ToastService, () => {
      return new ToastService()
    })

    this.bind(Web_TYPES.ApplicationEventObserver, () => {
      return new ApplicationEventObserver(
        application,
        application.routeService,
        this.get<PurchaseFlowController>(Web_TYPES.PurchaseFlowController),
        this.get<AccountMenuController>(Web_TYPES.AccountMenuController),
        this.get<PreferencesController>(Web_TYPES.PreferencesController),
        this.get<SyncStatusController>(Web_TYPES.SyncStatusController),
        application.sync,
        application.sessions,
        application.subscriptions,
        this.get<ToastService>(Web_TYPES.ToastService),
        application.user,
      )
    })
  }
}
