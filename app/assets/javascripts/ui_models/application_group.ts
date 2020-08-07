import { WebApplication } from './application';
import { removeFromArray } from 'snjs';
import {
  ArchiveManager,
  DesktopManager,
  KeyboardManager,
  LockManager,
  NativeExtManager,
  PreferencesManager,
  StatusManager,
  ThemeManager
} from '@/services';
import { AppState } from '@/ui_models/app_state';

type AppManagerChangeCallback = () => void

export class ApplicationGroup {

  $compile: ng.ICompileService
  $rootScope: ng.IRootScopeService
  $timeout: ng.ITimeoutService
  applications: WebApplication[] = []
  changeObservers: AppManagerChangeCallback[] = []
  activeApplication?: WebApplication

  /* @ngInject */
  constructor(
    $compile: ng.ICompileService,
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService
  ) {
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.onApplicationDeinit = this.onApplicationDeinit.bind(this);
    this.createDefaultApplication();

    /** FIXME(baptiste): rely on a less fragile method to detect Electron */
    if ((window as any).isElectron) {
      Object.defineProperty(window, 'desktopManager', {
        get: () => this.activeApplication?.getDesktopService()
      });
    }
  }

  private createDefaultApplication() {
    this.activeApplication = this.createNewApplication();
    this.applications.push(this.activeApplication!);
    this.notifyObserversOfAppChange();
  }

  /** @callback */
  onApplicationDeinit(application: WebApplication) {
    removeFromArray(this.applications, application);
    if (this.activeApplication === application) {
      this.activeApplication = undefined;
    }
    if (this.applications.length === 0) {
      this.createDefaultApplication();
    } else {
      this.notifyObserversOfAppChange();
    }
  }

  private createNewApplication() {
    const scope = this.$rootScope.$new(true);
    const application = new WebApplication(
      this.$compile,
      this.$timeout,
      scope,
      this.onApplicationDeinit
    );
    const appState = new AppState(
      this.$rootScope,
      this.$timeout,
      application
    );
    const archiveService = new ArchiveManager(
      application
    );
    const desktopService = new DesktopManager(
      this.$rootScope,
      this.$timeout,
      application
    );
    const keyboardService = new KeyboardManager();
    const lockService = new LockManager(
      application
    );
    const nativeExtService = new NativeExtManager(
      application
    );
    const prefsService = new PreferencesManager(
      application
    );
    const statusService = new StatusManager();
    const themeService = new ThemeManager(
      application,
    );
    application.setWebServices({
      appState,
      archiveService,
      desktopService,
      keyboardService,
      lockService,
      nativeExtService,
      prefsService,
      statusService,
      themeService
    });
    return application;
  }

  get application() {
    return this.activeApplication;
  }

  public getApplications() {
    return this.applications.slice();
  }

  /**
   * Notifies observer when the active application has changed.
   * Any application which is no longer active is destroyed, and
   * must be removed from the interface.
   */
  public addApplicationChangeObserver(callback: AppManagerChangeCallback) {
    this.changeObservers.push(callback);
    if (this.application) {
      callback();
    }

    return () => {
      removeFromArray(this.changeObservers, callback);
    }
  }

  private notifyObserversOfAppChange() {
    for (const observer of this.changeObservers) {
      observer();
    }
  }
}
