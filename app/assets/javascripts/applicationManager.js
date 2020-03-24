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
  ThemeManager,
  AppState
} from './services';

export class ApplicationManager {
  /* @ngInject */
  constructor($compile, $rootScope, $timeout) {
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.applications = [];
    this.changeObservers = [];
    this.onApplicationDeinit = this.onApplicationDeinit.bind(this);
    this.createDefaultApplication();
  }
  
  /** @access private */
  createDefaultApplication() {
    this.activeApplication = this.createNewApplication();
    this.applications.push(this.activeApplication);
    this.notifyObserversOfAppChange();
  }

  /** @callback */
  onApplicationDeinit(application) {
    removeFromArray(this.applications, application);
    if(this.activeApplication === application) {
      this.activeApplication = null;
    }
    if (this.applications.length === 0) {
      this.createDefaultApplication();
    }
    this.notifyObserversOfAppChange();
  }

  /** @access private */
  createNewApplication() {
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

  /** @access public */
  getApplications() {
    return this.applications.slice();
  }

  /**
   * Notifies observer when the active application has changed.
   * Any application which is no longer active is destroyed, and
   * must be removed from the interface.
   * @access public
   * @param {function} callback 
   */
  addApplicationChangeObserver(callback) {
    this.changeObservers.push(callback);
    if (this.application) {
      callback();
    }
  }

  notifyObserversOfAppChange() {
    for (const observer of this.changeObservers) {
      observer();
    }
  }

}