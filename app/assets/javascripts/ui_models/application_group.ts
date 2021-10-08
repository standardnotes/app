import { WebDeviceInterface } from '@/web_device_interface';
import { WebApplication } from './application';
import {
  ApplicationDescriptor,
  SNApplicationGroup,
  DeviceInterface,
  Platform,
} from '@standardnotes/snjs';
import { AppState } from '@/ui_models/app_state';
import { Bridge } from '@/services/bridge';
import { getPlatform, isDesktopApplication } from '@/utils';
import { ArchiveManager } from '@/services/archiveManager';
import { DesktopManager } from '@/services/desktopManager';
import { IOService } from '@/services/ioService';
import { AutolockService } from '@/services/autolock_service';
import { StatusManager } from '@/services/statusManager';
import { NativeExtManager } from '@/services/nativeExtManager';
import { ThemeManager } from '@/services/themeManager';

export class ApplicationGroup extends SNApplicationGroup {
  $compile: ng.ICompileService;
  $rootScope: ng.IRootScopeService;
  $timeout: ng.ITimeoutService;

  /* @ngInject */
  constructor(
    $compile: ng.ICompileService,
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
    private defaultSyncServerHost: string,
    private bridge: Bridge,
    private enableUnfinishedFeatures: boolean,
    private webSocketUrl: string,
  ) {
    super(new WebDeviceInterface($timeout, bridge));
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
  }

  async initialize(callback?: any): Promise<void> {
    await super.initialize({
      applicationCreator: this.createApplication,
    });

    if (isDesktopApplication()) {
      Object.defineProperty(window, 'desktopManager', {
        get: () =>
          (this.primaryApplication as WebApplication).getDesktopService(),
      });
    }
  }

  private createApplication = (
    descriptor: ApplicationDescriptor,
    deviceInterface: DeviceInterface
  ) => {
    const scope = this.$rootScope.$new(true);
    const platform = getPlatform();
    const application = new WebApplication(
      deviceInterface as WebDeviceInterface,
      platform,
      descriptor.identifier,
      this.$compile,
      scope,
      this.defaultSyncServerHost,
      this.bridge,
      this.enableUnfinishedFeatures,
      this.webSocketUrl,
    );
    const appState = new AppState(
      this.$rootScope,
      this.$timeout,
      application,
      this.bridge
    );
    const archiveService = new ArchiveManager(application);
    const desktopService = new DesktopManager(
      this.$rootScope,
      this.$timeout,
      application,
      this.bridge
    );
    const io = new IOService(
      platform === Platform.MacWeb || platform === Platform.MacDesktop
    );
    const autolockService = new AutolockService(application);
    const nativeExtService = new NativeExtManager(application);
    const statusManager = new StatusManager();
    const themeService = new ThemeManager(application);
    application.setWebServices({
      appState,
      archiveService,
      desktopService,
      io,
      autolockService,
      nativeExtService,
      statusManager,
      themeService,
    });
    return application;
  };
}
