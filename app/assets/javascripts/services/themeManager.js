import _ from 'lodash';
import {
  ApplicationEvent,
  StorageValueModes,
  EncryptionIntents,
  ApplicationService,
} from 'snjs';
import { AppStateEvents } from '@/services/state';

const CACHED_THEMES_KEY = 'cachedThemes';

export class ThemeManager extends ApplicationService {
  constructor(application) {
    super(application);
    this.activeThemes = [];
    setImmediate(() => {
      this.unsubState = this.application.getAppState().addObserver((eventName, data) => {
        if (eventName === AppStateEvents.DesktopExtsReady) {
          this.activateCachedThemes();
        }
      });
    });
  }

  deinit() {
    this.unsubState();
    this.unsubState = null;
    this.activeThemes.length = 0;
    this.unregisterDesktop();
    this.unregisterComponent();
    this.unregisterDesktop = null;
    this.unregisterComponent = null;
    super.deinit();
  }

  /** @override */
  onAppStart() {
    super.onAppStart();
    this.registerObservers();
    if (!this.application.getDesktopService().isDesktop) {
      this.activateCachedThemes();
    }
  }

  /** @access private */
  async activateCachedThemes() {
    const cachedThemes = await this.getCachedThemes();
    const writeToCache = false;
    for (const theme of cachedThemes) {
      this.activateTheme(theme, writeToCache);
    }
  }

  /** @access private */
  registerObservers() {
    this.unregisterDesktop = this.application.getDesktopService().registerUpdateObserver((component) => {
      if (component.active && component.isTheme()) {
        this.deactivateTheme(component);
        setTimeout(() => {
          this.activateTheme(component);
        }, 10);
      }
    });

    this.unregisterComponent = this.application.componentManager.registerHandler({
      identifier: 'themeManager',
      areas: ['themes'],
      activationHandler: (component) => {
        if (component.active) {
          this.activateTheme(component);
        } else {
          this.deactivateTheme(component);
        }
      }
    });
  }

  /** @access public */
  deactivateAllThemes() {
    const activeThemes = this.application.componentManager.getActiveThemes();
    for (const theme of activeThemes) {
      if (theme) {
        this.application.componentManager.deregisterComponent(theme);
      }
    }
    this.activeThemes = [];
    this.decacheThemes();
  }

  /** @access private */
  activateTheme(theme, writeToCache = true) {
    if (this.activeThemes.find((t) => t.uuid === theme.uuid)) {
      return;
    }
    this.activeThemes.push(theme);
    const url = this.application.componentManager.urlForComponent(theme);
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

  /** @access private */
  deactivateTheme(theme) {
    const element = document.getElementById(theme.uuid);
    if (element) {
      element.disabled = true;
      element.parentNode.removeChild(element);
    }
    _.remove(this.activeThemes, { uuid: theme.uuid });
    this.cacheThemes();
  }

  /** @access private */
  async cacheThemes() {
    const mapped = await Promise.all(this.activeThemes.map(async (theme) => {
      const payload = theme.payloadRepresentation();
      const processedPayload = await this.application.protocolService.payloadByEncryptingPayload({
        payload: payload,
        intent: EncryptionIntents.LocalStorageDecrypted
      });
      return processedPayload;
    }));
    return this.application.setValue(
      CACHED_THEMES_KEY,
      mapped,
      StorageValueModes.Nonwrapped
    );
  }

  /** @access private */
  async decacheThemes() {
    return this.application.removeValue(
      CACHED_THEMES_KEY,
      StorageValueModes.Nonwrapped
    );
  }

  /** @access private */
  async getCachedThemes() {
    const cachedThemes = await this.application.getValue(
      CACHED_THEMES_KEY,
      StorageValueModes.Nonwrapped
    );
    if (cachedThemes) {
      const themes = [];
      for (const cachedTheme of cachedThemes) {
        const payload = this.application.createPayloadFromObject(cachedTheme);
        const theme = this.application.createItemFromPayload(payload);
        themes.push(theme);
      }
      return themes;
    } else {
      return [];
    }
  }
}
