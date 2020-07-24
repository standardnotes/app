import { WebApplication } from '@/ui_models/application';
import _ from 'lodash';
import {
  StorageValueModes,
  EncryptionIntent,
  ApplicationService,
  SNTheme,
  ComponentArea,
  removeFromArray,
  ApplicationEvent
} from 'snjs';
import { AppStateEvent } from '@/ui_models/app_state';

const CACHED_THEMES_KEY = 'cachedThemes';

export class ThemeManager extends ApplicationService {

  private activeThemes: string[] = []
  private unsubState?: () => void
  private unregisterDesktop!: () => void
  private unregisterComponent!: () => void

  /** @override */
  async onAppLaunch() {
    super.onAppLaunch();
    this.unsubState = this.webApplication.getAppState().addObserver(
      async (eventName) => {
        if (eventName === AppStateEvent.DesktopExtsReady) {
          this.activateCachedThemes();
        }
      }
    );
  }

  onAppEvent(event: ApplicationEvent) {
    super.onAppEvent(event);
    if (event === ApplicationEvent.SignedOut) {
      this.deactivateAllThemes();
    }
  }

  get webApplication() {
    return this.application as WebApplication;
  }

  deinit() {
    this.unsubState?.();
    (this.unsubState as any) = undefined;
    this.activeThemes.length = 0;
    this.unregisterDesktop();
    this.unregisterComponent();
    (this.unregisterDesktop as any) = undefined;
    (this.unregisterComponent as any) = undefined;
    super.deinit();
  }

  /** @override */
  async onAppStart() {
    super.onAppStart();
    this.registerObservers();
    if (!this.webApplication.getDesktopService().isDesktop) {
      this.activateCachedThemes();
    }
  }

  private async activateCachedThemes() {
    const cachedThemes = await this.getCachedThemes();
    const writeToCache = false;
    for (const theme of cachedThemes) {
      this.activateTheme(theme, writeToCache);
    }
  }

  private registerObservers() {
    this.unregisterDesktop = this.webApplication.getDesktopService()
      .registerUpdateObserver((component) => {
        if (component.active && component.isTheme()) {
          this.deactivateTheme(component.uuid);
          setTimeout(() => {
            this.activateTheme(component as SNTheme);
          }, 10);
        }
      });

    this.unregisterComponent = this.application!.componentManager!.registerHandler({
      identifier: 'themeManager',
      areas: [ComponentArea.Themes],
      activationHandler: (uuid, component) => {
        if (component?.active) {
          this.activateTheme(component as SNTheme);
        } else {
          this.deactivateTheme(uuid);
        }
      }
    });
  }

  private deactivateAllThemes() {
    for (const uuid of this.activeThemes) {
      this.deactivateTheme(uuid, false);
    }
    this.activeThemes = [];
    this.decacheThemes();
  }

  private activateTheme(theme: SNTheme, writeToCache = true) {
    if (this.activeThemes.find((uuid) => uuid === theme.uuid)) {
      return;
    }
    this.activeThemes.push(theme.uuid);
    const url = this.application!.componentManager!.urlForComponent(theme)!;
    const link = document.createElement('link');
    link.href = url;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.media = 'screen,print';
    link.id = theme.uuid;
    document.getElementsByTagName('head')[0].appendChild(link);
    if (writeToCache) {
      this.cacheThemes();
    }
  }

  private deactivateTheme(uuid: string, recache = true) {
    const element = document.getElementById(uuid) as HTMLLinkElement;
    if (element) {
      element.disabled = true;
      element.parentNode!.removeChild(element);
    }
    removeFromArray(this.activeThemes, uuid);
    if (recache) {
      this.cacheThemes();
    }
  }

  private async cacheThemes() {
    const themes = this.application!.getAll(this.activeThemes) as SNTheme[];
    const mapped = await Promise.all(themes.map(async (theme) => {
      const payload = theme.payloadRepresentation();
      const processedPayload = await this.application!.protocolService!.payloadByEncryptingPayload(
        payload,
        EncryptionIntent.LocalStorageDecrypted
      );
      return processedPayload;
    }));
    return this.application!.setValue(
      CACHED_THEMES_KEY,
      mapped,
      StorageValueModes.Nonwrapped
    );
  }

  private async decacheThemes() {
    if (this.application) {
      return this.application.removeValue(
        CACHED_THEMES_KEY,
        StorageValueModes.Nonwrapped
      );
    }
  }

  private async getCachedThemes() {
    const cachedThemes = await this.application!.getValue(
      CACHED_THEMES_KEY,
      StorageValueModes.Nonwrapped
    );
    if (cachedThemes) {
      const themes = [];
      for (const cachedTheme of cachedThemes) {
        const payload = this.application!.createPayloadFromObject(cachedTheme);
        const theme = this.application!.createItemFromPayload(payload) as SNTheme;
        themes.push(theme);
      }
      return themes;
    } else {
      return [];
    }
  }
}
