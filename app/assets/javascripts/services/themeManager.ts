import { WebApplication } from '@/ui_models/application';
import _ from 'lodash';
import {
  StorageValueModes,
  EncryptionIntent,
  ApplicationService,
  SNTheme,
  ComponentArea,
} from 'snjs';
import { AppStateEvent } from '@/services/state';

const CACHED_THEMES_KEY = 'cachedThemes';

export class ThemeManager extends ApplicationService {

  private activeThemes: SNTheme[]
  private unsubState!: () => void
  private unregisterDesktop!: () => void
  private unregisterComponent!: () => void

  constructor(application: WebApplication) {
    super(application);
    this.activeThemes = [];
    setImmediate(() => {
      this.unsubState = this.webApplication.getAppState().addObserver(
        async (eventName) => {
          if (eventName === AppStateEvent.DesktopExtsReady) {
            this.activateCachedThemes();
          }
        }
      );
    });
  }

  get webApplication() {
    return this.application as WebApplication;
  }

  deinit() {
    this.unsubState();
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
          this.deactivateTheme(component as SNTheme);
          setTimeout(() => {
            this.activateTheme(component as SNTheme);
          }, 10);
        }
      });

    this.unregisterComponent = this.application!.componentManager!.registerHandler({
      identifier: 'themeManager',
      areas: [ComponentArea.Themes],
      activationHandler: (component) => {
        if (component.active) {
          this.activateTheme(component as SNTheme);
        } else {
          this.deactivateTheme(component as SNTheme);
        }
      }
    });
  }

  public deactivateAllThemes() {
    const activeThemes = this.application!.componentManager!.getActiveThemes();
    for (const theme of activeThemes) {
      if (theme) {
        this.application!.componentManager!.deregisterComponent(theme);
      }
    }
    this.activeThemes = [];
    this.decacheThemes();
  }

  private activateTheme(theme: SNTheme, writeToCache = true) {
    if (this.activeThemes.find((t) => t.uuid === theme.uuid)) {
      return;
    }
    this.activeThemes.push(theme);
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

  private deactivateTheme(theme: SNTheme) {
    const element = document.getElementById(theme.uuid) as HTMLLinkElement;
    if (element) {
      element.disabled = true;
      element.parentNode!.removeChild(element);
    }
    _.remove(this.activeThemes, { uuid: theme.uuid });
    this.cacheThemes();
  }

  private async cacheThemes() {
    const mapped = await Promise.all(this.activeThemes.map(async (theme) => {
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
    return this.application!.removeValue(
      CACHED_THEMES_KEY,
      StorageValueModes.Nonwrapped
    );
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
