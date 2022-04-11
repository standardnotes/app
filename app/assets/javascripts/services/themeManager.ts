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
  CreateIntentPayloadFromObject,
} from '@standardnotes/snjs';
import { InternalEventBus } from '@standardnotes/services';
import {
  dismissToast,
  ToastType,
  addTimedToast,
} from '@standardnotes/stylekit';

const CACHED_THEMES_KEY = 'cachedThemes';
const TimeBeforeApplyingColorScheme = 5;

export class ThemeManager extends ApplicationService {
  private activeThemes: UuidString[] = [];
  private unregisterDesktop!: () => void;
  private unregisterStream!: () => void;
  private lastUseDeviceThemeSettings = false;

  constructor(application: WebApplication) {
    super(application, new InternalEventBus());
    this.colorSchemeEventHandler = this.colorSchemeEventHandler.bind(this);
  }

  async onAppStart() {
    super.onAppStart();
    this.registerObservers();
  }

  async onAppEvent(event: ApplicationEvent) {
    super.onAppEvent(event);
    switch (event) {
      case ApplicationEvent.SignedOut: {
        this.deactivateAllThemes();
        this.activeThemes = [];
        this.application?.removeValue(
          CACHED_THEMES_KEY,
          StorageValueModes.Nonwrapped
        );
        break;
      }
      case ApplicationEvent.StorageReady: {
        await this.activateCachedThemes();
        break;
      }
      case ApplicationEvent.FeaturesUpdated: {
        this.handleFeaturesUpdated();
        break;
      }
      case ApplicationEvent.Launched: {
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', this.colorSchemeEventHandler);
        break;
      }
      case ApplicationEvent.PreferencesChanged: {
        this.handlePreferencesChangeEvent();
        break;
      }
    }
  }

  private handlePreferencesChangeEvent(): void {
    const useDeviceThemeSettings = this.application.getPreference(
      PrefKey.UseSystemColorScheme,
      false
    );

    if (useDeviceThemeSettings === this.lastUseDeviceThemeSettings) {
      return;
    }

    this.lastUseDeviceThemeSettings = useDeviceThemeSettings;

    if (!useDeviceThemeSettings) {
      return;
    }

    const prefersDarkColorScheme = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    this.setThemeAsPerColorScheme(
      useDeviceThemeSettings,
      prefersDarkColorScheme.matches,
      true
    );
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

  private handleFeaturesUpdated(): void {
    let hasChange = false;
    for (const themeUuid of this.activeThemes) {
      const theme = this.application.items.findItem(themeUuid) as SNTheme;
      if (!theme) {
        this.deactivateTheme(themeUuid);
        hasChange = true;
      } else {
        const status = this.application.features.getFeatureStatus(
          theme.identifier
        );
        if (status !== FeatureStatus.Entitled) {
          if (theme.active) {
            this.application.mutator.toggleTheme(theme);
          } else {
            this.deactivateTheme(theme.uuid);
          }
          hasChange = true;
        }
      }
    }

    const activeThemes = (
      this.application.items.getItems(ContentType.Theme) as SNTheme[]
    ).filter((theme) => theme.active);

    for (const theme of activeThemes) {
      if (!this.activeThemes.includes(theme.uuid)) {
        this.activateTheme(theme);
        hasChange = true;
      }
    }

    if (hasChange) {
      this.cacheThemeState();
    }
  }

  private colorSchemeEventHandler(event: MediaQueryListEvent) {
    this.setThemeAsPerColorScheme(
      this.lastUseDeviceThemeSettings,
      event.matches,
      false
    );
  }

  private setThemeAsPerColorScheme(
    useDeviceThemeSettings: boolean,
    prefersDarkColorScheme: boolean,
    showTimedToast: boolean
  ) {
    if (useDeviceThemeSettings) {
      const preference = prefersDarkColorScheme
        ? PrefKey.AutoDarkThemeIdentifier
        : PrefKey.AutoLightThemeIdentifier;
      const themes = this.application.items.getDisplayableItems(
        ContentType.Theme
      ) as SNTheme[];

      const activeTheme = themes.find(
        (theme) => theme.active && !theme.isLayerable()
      );

      const enableDefaultTheme = () => {
        if (activeTheme) this.application.mutator.toggleTheme(activeTheme);
      };

      const themeIdentifier = this.application.getPreference(
        preference,
        'Default'
      ) as string;

      const setTheme = () => {
        if (themeIdentifier === 'Default') {
          enableDefaultTheme();
        } else {
          const theme = themes.find(
            (theme) => theme.package_info.identifier === themeIdentifier
          );
          if (theme && !theme.active) {
            this.application.mutator.toggleTheme(theme);
          }
        }
      };

      const isPreferredThemeActive =
        activeTheme?.identifier === themeIdentifier;

      const isPreferredThemeDefaultAndActive =
        themeIdentifier === 'Default' && !activeTheme;

      if (isPreferredThemeActive || isPreferredThemeDefaultAndActive) {
        return;
      }

      if (showTimedToast) {
        const [toastId, intervalId] = addTimedToast(
          {
            type: ToastType.Regular,
            message: (timeRemaining) =>
              `Applying system color scheme in ${timeRemaining}s...`,
            actions: [
              {
                label: 'Keep current theme',
                handler: () => {
                  dismissToast(toastId);
                },
              },
              {
                label: 'Apply now',
                handler: () => {
                  dismissToast(toastId);
                  clearInterval(intervalId);
                  setTheme();
                },
              },
            ],
          },
          setTheme,
          TimeBeforeApplyingColorScheme
        );
      } else {
        setTheme();
      }
    }
  }

  private async activateCachedThemes() {
    const cachedThemes = await this.getCachedThemes();
    for (const theme of cachedThemes) {
      this.activateTheme(theme, true);
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

  private activateTheme(theme: SNTheme, skipEntitlementCheck = false) {
    if (this.activeThemes.find((uuid) => uuid === theme.uuid)) {
      return;
    }

    if (
      !skipEntitlementCheck &&
      this.application.features.getFeatureStatus(theme.identifier) !==
        FeatureStatus.Entitled
    ) {
      return;
    }

    const url = this.application.componentManager.urlForComponent(theme);
    if (!url) {
      return;
    }

    this.activeThemes.push(theme.uuid);

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
    const themes = this.application.items.findItems(
      this.activeThemes
    ) as SNTheme[];

    const mapped = themes.map((theme) => {
      const payload = theme.payloadRepresentation();
      return CreateIntentPayloadFromObject(
        payload,
        EncryptionIntent.LocalStorageDecrypted
      );
    });

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
        const payload =
          this.application.items.createPayloadFromObject(cachedTheme);
        const theme = this.application.items.createItemFromPayload(
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
