import { WebApplication } from '@/ui_models/application';
import {
  StorageValueModes,
  EncryptionIntent,
  ApplicationService,
  SNTheme,
  removeFromArray,
  ApplicationEvent,
  ContentType,
  UuidString,
  FeatureStatus,
  PayloadSource,
  PrefKey,
} from '@standardnotes/snjs';

const CACHED_THEMES_KEY = 'cachedThemes';

export class ThemeManager extends ApplicationService {
  private activeThemes: UuidString[] = [];
  private unregisterDesktop!: () => void;
  private unregisterStream!: () => void;

  constructor(application: WebApplication) {
    super(application);
    this.colorSchemeEventHandler = this.colorSchemeEventHandler.bind(this);
  }

  private colorSchemeEventHandler(event: MediaQueryListEvent) {
    this.setThemeAsPerColorScheme(event.matches);
  }

  private setThemeAsPerColorScheme(prefersDarkColorScheme: boolean) {
    const useDeviceThemeSettings = this.application.getPreference(
      PrefKey.UseSystemColorScheme,
      false
    );

    if (useDeviceThemeSettings) {
      const preference = prefersDarkColorScheme
        ? PrefKey.AutoDarkThemeIdentifier
        : PrefKey.AutoLightThemeIdentifier;
      const themes = this.application.getDisplayableItems(
        ContentType.Theme
      ) as SNTheme[];

      const enableDefaultTheme = () => {
        const activeTheme = themes.find(
          (theme) => theme.active && !theme.isLayerable()
        );
        if (activeTheme) this.application.toggleTheme(activeTheme);
      };

      const themeIdentifier = this.application.getPreference(
        preference,
        'Default'
      ) as string;
      if (themeIdentifier === 'Default') {
        enableDefaultTheme();
      } else {
        const theme = themes.find(
          (theme) => theme.package_info.identifier === themeIdentifier
        );
        if (theme && !theme.active) {
          this.application.toggleTheme(theme);
        }
      }
    }
  }

  async onAppEvent(event: ApplicationEvent) {
    super.onAppEvent(event);
    if (event === ApplicationEvent.SignedOut) {
      this.deactivateAllThemes();
      this.activeThemes = [];
      this.application?.removeValue(
        CACHED_THEMES_KEY,
        StorageValueModes.Nonwrapped
      );
    } else if (event === ApplicationEvent.StorageReady) {
      await this.activateCachedThemes();
    } else if (event === ApplicationEvent.FeaturesUpdated) {
      this.reloadThemeStatus();
    } else if (event === ApplicationEvent.Launched) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', this.colorSchemeEventHandler);
    } else if (event === ApplicationEvent.PreferencesChanged) {
      const prefersDarkColorScheme = window.matchMedia(
        '(prefers-color-scheme: dark)'
      );
      this.setThemeAsPerColorScheme(prefersDarkColorScheme.matches);
    }
  }

  get webApplication() {
    return this.application as WebApplication;
  }

  deinit() {
    this.activeThemes.length = 0;
    this.unregisterDesktop();
    this.unregisterStream();
    (this.unregisterDesktop as unknown) = undefined;
    (this.unregisterStream as unknown) = undefined;
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .removeEventListener('change', this.colorSchemeEventHandler);
    super.deinit();
  }

  private reloadThemeStatus(): void {
    let hasChange = false;
    for (const themeUuid of this.activeThemes) {
      const theme = this.application.findItem(themeUuid) as SNTheme;
      if (
        !theme ||
        this.application.getFeatureStatus(theme.identifier) !==
          FeatureStatus.Entitled
      ) {
        this.deactivateTheme(themeUuid);
        hasChange = true;
      }
    }

    if (hasChange) {
      this.cacheThemeState();
    }
  }

  async onAppStart() {
    super.onAppStart();
    this.registerObservers();
  }

  private async activateCachedThemes() {
    const cachedThemes = await this.getCachedThemes();
    for (const theme of cachedThemes) {
      this.activateTheme(theme);
    }
  }

  private registerObservers() {
    this.unregisterDesktop = this.webApplication
      .getDesktopService()
      .registerUpdateObserver((component) => {
        if (component.active && component.isTheme()) {
          this.deactivateTheme(component.uuid);
          setTimeout(() => {
            this.activateTheme(component as SNTheme);
            this.cacheThemeState();
          }, 10);
        }
      });

    this.unregisterStream = this.application.streamItems(
      ContentType.Theme,
      (items, source) => {
        const themes = items as SNTheme[];
        for (const theme of themes) {
          if (theme.active) {
            this.activateTheme(theme);
          } else {
            this.deactivateTheme(theme.uuid);
          }
        }
        if (source !== PayloadSource.LocalRetrieved) {
          this.cacheThemeState();
        }
      }
    );
  }

  public deactivateAllThemes() {
    const activeThemes = this.activeThemes.slice();
    for (const uuid of activeThemes) {
      this.deactivateTheme(uuid);
    }
  }

  private activateTheme(theme: SNTheme) {
    if (this.activeThemes.find((uuid) => uuid === theme.uuid)) {
      return;
    }
    this.activeThemes.push(theme.uuid);
    const url = this.application.componentManager.urlForComponent(theme);
    if (!url) {
      return;
    }

    const link = document.createElement('link');
    link.href = url;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.media = 'screen,print';
    link.id = theme.uuid;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  private deactivateTheme(uuid: string) {
    const element = document.getElementById(uuid) as HTMLLinkElement;
    if (element) {
      element.disabled = true;
      element.parentNode?.removeChild(element);
    }

    removeFromArray(this.activeThemes, uuid);
  }

  private async cacheThemeState() {
    const themes = this.application.getAll(this.activeThemes) as SNTheme[];
    const mapped = await Promise.all(
      themes.map(async (theme) => {
        const payload = theme.payloadRepresentation();
        const processedPayload =
          await this.application.protocolService.payloadByEncryptingPayload(
            payload,
            EncryptionIntent.LocalStorageDecrypted
          );
        return processedPayload;
      })
    );
    return this.application.setValue(
      CACHED_THEMES_KEY,
      mapped,
      StorageValueModes.Nonwrapped
    );
  }

  private async getCachedThemes() {
    const cachedThemes = (await this.application.getValue(
      CACHED_THEMES_KEY,
      StorageValueModes.Nonwrapped
    )) as SNTheme[];
    if (cachedThemes) {
      const themes = [];
      for (const cachedTheme of cachedThemes) {
        const payload = this.application.createPayloadFromObject(cachedTheme);
        const theme = this.application.createItemFromPayload(
          payload
        ) as SNTheme;
        themes.push(theme);
      }
      return themes;
    } else {
      return [];
    }
  }
}
