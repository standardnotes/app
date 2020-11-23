import { WebDeviceInterface } from '@/web_device_interface';
import { WebApplication } from './application';
import { ApplicationDescriptor, SNApplicationGroup, DeviceInterface } from '@standardnotes/snjs';
import {
  ArchiveManager,
  DesktopManager,
  KeyboardManager,
  AutolockService,
  NativeExtManager,
  PreferencesManager,
  StatusManager,
  ThemeManager
} from '@/services';
import { AppState } from '@/ui_models/app_state';
import { Bridge } from '@/services/bridge';
import { isDesktopApplication } from '@/utils';

export class ApplicationGroup extends SNApplicationGroup {

  $compile: ng.ICompileService
  $rootScope: ng.IRootScopeService
  $timeout: ng.ITimeoutService

  /* @ngInject */
  constructor(
    $compile: ng.ICompileService,
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
    private defaultSyncServerHost: string,
    private bridge: Bridge,
  ) {
    super(new WebDeviceInterface(
      $timeout,
      bridge
    ));
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
  }

  async initialize(callback?: any) {
    await super.initialize({
      applicationCreator: this.createApplication
    });

    if (isDesktopApplication()) {
      Object.defineProperty(window, 'desktopManager', {
        get: () => (this.primaryApplication as WebApplication).getDesktopService()
      });
    }
  }

  private createApplication = (descriptor: ApplicationDescriptor, deviceInterface: DeviceInterface) => {
    const scope = this.$rootScope.$new(true);
    const application = new WebApplication(
      deviceInterface as WebDeviceInterface,
      descriptor.identifier,
      this.$compile,
      scope,
      this.defaultSyncServerHost,
      this.bridge,
    );
    const appState = new AppState(
      this.$rootScope,
      this.$timeout,
      application,
      this.bridge,
    );
    const archiveService = new ArchiveManager(
      application
    );
    const desktopService = new DesktopManager(
      this.$rootScope,
      this.$timeout,
      application,
      this.bridge,
    );
    const keyboardService = new KeyboardManager();
    const autolockService = new AutolockService(
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
      autolockService,
      nativeExtService,
      prefsService,
      statusManager: statusService,
      themeService
    });
    return application;
  }
}
