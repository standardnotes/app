import { WebCrypto } from '@/crypto';
import { AlertService } from '@/services/alertService';
import { ArchiveManager } from '@/services/archiveManager';
import { AutolockService } from '@/services/autolock_service';
import { Bridge } from '@/services/bridge';
import { DesktopManager } from '@/services/desktopManager';
import { IOService } from '@/services/ioService';
import { StatusManager } from '@/services/statusManager';
import { ThemeManager } from '@/services/themeManager';
import { AppState } from '@/ui_models/app_state';
import { WebDeviceInterface } from '@/web_device_interface';
import {
  DeinitSource,
  Platform,
  SNApplication,
  NoteGroupController,
  removeFromArray,
  IconsController,
  Runtime,
} from '@standardnotes/snjs';

type WebServices = {
  appState: AppState;
  desktopService: DesktopManager;
  autolockService: AutolockService;
  archiveService: ArchiveManager;
  statusManager: StatusManager;
  themeService: ThemeManager;
  io: IOService;
};

export enum WebAppEvent {
  NewUpdateAvailable = 'NewUpdateAvailable',
  DesktopWindowGainedFocus = 'DesktopWindowGainedFocus',
  DesktopWindowLostFocus = 'DesktopWindowLostFocus',
}

export type WebEventObserver = (event: WebAppEvent) => void;

export class WebApplication extends SNApplication {
  private webServices!: WebServices;
  private webEventObservers: WebEventObserver[] = [];
  public noteControllerGroup: NoteGroupController;
  public iconsController: IconsController;

  constructor(
    deviceInterface: WebDeviceInterface,
    platform: Platform,
    identifier: string,
    defaultSyncServerHost: string,
    public bridge: Bridge,
    webSocketUrl: string,
    runtime: Runtime
  ) {
    super({
      environment: bridge.environment,
      platform: platform,
      deviceInterface: deviceInterface,
      crypto: WebCrypto,
      alertService: new AlertService(),
      identifier,
      defaultHost: defaultSyncServerHost,
      appVersion: bridge.appVersion,
      webSocketUrl: webSocketUrl,
      runtime,
    });
    deviceInterface.setApplication(this);
    this.noteControllerGroup = new NoteGroupController(this);
    this.iconsController = new IconsController();
  }

  deinit(source: DeinitSource): void {
    super.deinit(source);
    try {
      if (source === DeinitSource.AppGroupUnload) {
        this.getThemeService().deactivateAllThemes();
      }
      for (const service of Object.values(this.webServices)) {
        if ('deinit' in service) {
          service.deinit?.(source);
        }
        (service as any).application = undefined;
      }
      this.webServices = {} as WebServices;
      this.noteControllerGroup.deinit();
      this.iconsController.deinit();
      this.webEventObservers.length = 0;

      if (source === DeinitSource.SignOut) {
        this.bridge.onSignOut();
      }
    } catch (error) {
      console.error('Error while deiniting application', error);
    }
  }

  setWebServices(services: WebServices): void {
    this.webServices = services;
  }

  public addWebEventObserver(observer: WebEventObserver): () => void {
    this.webEventObservers.push(observer);
    return () => {
      removeFromArray(this.webEventObservers, observer);
    };
  }

  public notifyWebEvent(event: WebAppEvent): void {
    for (const observer of this.webEventObservers) {
      observer(event);
    }
  }

  public getAppState(): AppState {
    return this.webServices.appState;
  }

  public getDesktopService(): DesktopManager {
    return this.webServices.desktopService;
  }

  public getAutolockService() {
    return this.webServices.autolockService;
  }

  public getArchiveService() {
    return this.webServices.archiveService;
  }

  getStatusManager() {
    return this.webServices.statusManager;
  }

  public getThemeService() {
    return this.webServices.themeService;
  }

  public get io() {
    return this.webServices.io;
  }

  async checkForSecurityUpdate() {
    return this.protocolUpgradeAvailable();
  }

  downloadBackup(): void | Promise<void> {
    return this.bridge.downloadBackup();
  }

  async signOutAndDeleteLocalBackups(): Promise<void> {
    await this.bridge.deleteLocalBackups();
    return this.user.signOut();
  }
}
