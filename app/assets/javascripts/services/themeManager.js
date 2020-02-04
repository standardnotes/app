import _ from 'lodash';
import angular from 'angular';
import { SNTheme, SFItemParams } from 'snjs';
import { StorageManager } from './storageManager';
import {
  APP_STATE_EVENT_DESKTOP_EXTS_READY
} from '@/state';

export class ThemeManager {
  /* @ngInject */
  constructor(
    componentManager,
    desktopManager,
    storageManager,
    passcodeManager,
    appState
  ) {
    this.componentManager = componentManager;
    this.storageManager = storageManager;
    this.desktopManager = desktopManager;
    this.activeThemes = [];

    ThemeManager.CachedThemesKey = "cachedThemes";

    this.registerObservers();

    // When a passcode is added, all local storage will be encrypted (it doesn't know what was
    // originally saved as Fixed or FixedEncrypted). We want to rewrite cached themes here to Fixed
    // so that it's readable without authentication.
    passcodeManager.addPasscodeChangeObserver(() => {
      this.cacheThemes();
    });

    if (desktopManager.isDesktop) {
      appState.addObserver((eventName, data) => {
        if (eventName === APP_STATE_EVENT_DESKTOP_EXTS_READY) {
          this.activateCachedThemes();
        }
      });
    } else {
      this.activateCachedThemes();
    }
  }

  activateCachedThemes() {
    const cachedThemes = this.getCachedThemes();
    const writeToCache = false;
    for (const theme of cachedThemes) {
      this.activateTheme(theme, writeToCache);
    }
  }

  registerObservers() {
    this.desktopManager.registerUpdateObserver((component) => {
      // Reload theme if active
      if (component.active && component.isTheme()) {
        this.deactivateTheme(component);
        setTimeout(() => {
          this.activateTheme(component);
        }, 10);
      }
    });

    this.componentManager.registerHandler({
      identifier: "themeManager",
      areas: ["themes"],
      activationHandler: (component) => {
        if (component.active) {
          this.activateTheme(component);
        } else {
          this.deactivateTheme(component);
        }
      }
    });
  }

  hasActiveTheme() {
    return this.componentManager.getActiveThemes().length > 0;
  }

  deactivateAllThemes() {
    var activeThemes = this.componentManager.getActiveThemes();
    for (var theme of activeThemes) {
      if (theme) {
        this.componentManager.deactivateComponent(theme);
      }
    }

    this.decacheThemes();
  }

  activateTheme(theme, writeToCache = true) {
    if (_.find(this.activeThemes, { uuid: theme.uuid })) {
      return;
    }

    this.activeThemes.push(theme);

    var url = this.componentManager.urlForComponent(theme);
    var link = document.createElement("link");
    link.href = url;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.media = "screen,print";
    link.id = theme.uuid;
    document.getElementsByTagName("head")[0].appendChild(link);

    if (writeToCache) {
      this.cacheThemes();
    }
  }

  deactivateTheme(theme) {
    var element = document.getElementById(theme.uuid);
    if (element) {
      element.disabled = true;
      element.parentNode.removeChild(element);
    }

    _.remove(this.activeThemes, { uuid: theme.uuid });

    this.cacheThemes();
  }

  async cacheThemes() {
    const mapped = await Promise.all(this.activeThemes.map(async (theme) => {
      const transformer = new SFItemParams(theme);
      const params = await transformer.paramsForLocalStorage();
      return params;
    }));
    const data = JSON.stringify(mapped);
    return this.storageManager.setItem(ThemeManager.CachedThemesKey, data, StorageManager.Fixed);
  }

  async decacheThemes() {
    return this.storageManager.removeItem(ThemeManager.CachedThemesKey, StorageManager.Fixed);
  }

  getCachedThemes() {
    const cachedThemes = this.storageManager.getItemSync(ThemeManager.CachedThemesKey, StorageManager.Fixed);
    if (cachedThemes) {
      const parsed = JSON.parse(cachedThemes);
      return parsed.map((theme) => {
        return new SNTheme(theme);
      });
    } else {
      return [];
    }
  }
}
