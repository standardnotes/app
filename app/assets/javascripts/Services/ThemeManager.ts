import { WebApplication } from '@/UIModels/Application'
import {
  StorageValueModes,
  ApplicationService,
  SNTheme,
  removeFromArray,
  ApplicationEvent,
  ContentType,
  UuidString,
  FeatureStatus,
  PayloadSource,
  PrefKey,
  CreateDecryptedLocalStorageContextPayload,
  InternalEventBus,
} from '@standardnotes/snjs'
import { dismissToast, ToastType, addTimedToast } from '@standardnotes/stylekit'

const CachedThemesKey = 'cachedThemes'
const TimeBeforeApplyingColorScheme = 5
const DefaultThemeIdentifier = 'Default'

export class ThemeManager extends ApplicationService {
  private activeThemes: UuidString[] = []
  private unregisterDesktop!: () => void
  private unregisterStream!: () => void
  private lastUseDeviceThemeSettings = false

  constructor(application: WebApplication) {
    super(application, new InternalEventBus())
    this.colorSchemeEventHandler = this.colorSchemeEventHandler.bind(this)
  }

  override async onAppStart() {
    super.onAppStart().catch(console.error)
    this.registerObservers()
  }

  override async onAppEvent(event: ApplicationEvent) {
    super.onAppEvent(event).catch(console.error)
    switch (event) {
      case ApplicationEvent.SignedOut: {
        this.deactivateAllThemes()
        this.activeThemes = []
        this.application
          ?.removeValue(CachedThemesKey, StorageValueModes.Nonwrapped)
          .catch(console.error)
        break
      }
      case ApplicationEvent.StorageReady: {
        await this.activateCachedThemes()
        break
      }
      case ApplicationEvent.FeaturesUpdated: {
        this.handleFeaturesUpdated()
        break
      }
      case ApplicationEvent.Launched: {
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', this.colorSchemeEventHandler)
        break
      }
      case ApplicationEvent.PreferencesChanged: {
        this.handlePreferencesChangeEvent()
        break
      }
    }
  }

  private handlePreferencesChangeEvent(): void {
    const useDeviceThemeSettings = this.application.getPreference(
      PrefKey.UseSystemColorScheme,
      false,
    )

    if (useDeviceThemeSettings !== this.lastUseDeviceThemeSettings) {
      this.lastUseDeviceThemeSettings = useDeviceThemeSettings
    }

    if (useDeviceThemeSettings) {
      const prefersDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)')

      this.setThemeAsPerColorScheme(prefersDarkColorScheme.matches)
    }
  }

  get webApplication() {
    return this.application as WebApplication
  }

  override deinit() {
    this.activeThemes.length = 0
    this.unregisterDesktop()
    this.unregisterStream()
    ;(this.unregisterDesktop as unknown) = undefined
    ;(this.unregisterStream as unknown) = undefined
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .removeEventListener('change', this.colorSchemeEventHandler)
    super.deinit()
  }

  private handleFeaturesUpdated(): void {
    let hasChange = false
    for (const themeUuid of this.activeThemes) {
      const theme = this.application.items.findItem(themeUuid) as SNTheme
      if (!theme) {
        this.deactivateTheme(themeUuid)
        hasChange = true
      } else {
        const status = this.application.features.getFeatureStatus(theme.identifier)
        if (status !== FeatureStatus.Entitled) {
          if (theme.active) {
            this.application.mutator.toggleTheme(theme).catch(console.error)
          } else {
            this.deactivateTheme(theme.uuid)
          }
          hasChange = true
        }
      }
    }

    const activeThemes = (this.application.items.getItems(ContentType.Theme) as SNTheme[]).filter(
      (theme) => theme.active,
    )

    for (const theme of activeThemes) {
      if (!this.activeThemes.includes(theme.uuid)) {
        this.activateTheme(theme)
        hasChange = true
      }
    }

    if (hasChange) {
      this.cacheThemeState().catch(console.error)
    }
  }

  private colorSchemeEventHandler(event: MediaQueryListEvent) {
    this.setThemeAsPerColorScheme(event.matches)
  }

  private showColorSchemeToast(setThemeCallback: () => void) {
    const [toastId, intervalId] = addTimedToast(
      {
        type: ToastType.Regular,
        message: (timeRemaining) => `Applying system color scheme in ${timeRemaining}s...`,
        actions: [
          {
            label: 'Keep current theme',
            handler: () => {
              dismissToast(toastId)
              clearInterval(intervalId)
            },
          },
          {
            label: 'Apply now',
            handler: () => {
              dismissToast(toastId)
              clearInterval(intervalId)
              setThemeCallback()
            },
          },
        ],
      },
      setThemeCallback,
      TimeBeforeApplyingColorScheme,
    )
  }

  private setThemeAsPerColorScheme(prefersDarkColorScheme: boolean) {
    const preference = prefersDarkColorScheme
      ? PrefKey.AutoDarkThemeIdentifier
      : PrefKey.AutoLightThemeIdentifier

    const themes = this.application.items.getDisplayableItems(ContentType.Theme) as SNTheme[]

    const activeTheme = themes.find((theme) => theme.active && !theme.isLayerable())

    const themeIdentifier = this.application.getPreference(
      preference,
      DefaultThemeIdentifier,
    ) as string

    const setTheme = () => {
      if (themeIdentifier === DefaultThemeIdentifier && activeTheme) {
        this.application.mutator.toggleTheme(activeTheme).catch(console.error)
      } else {
        const theme = themes.find((theme) => theme.package_info.identifier === themeIdentifier)
        if (theme && !theme.active) {
          this.application.mutator.toggleTheme(theme).catch(console.error)
        }
      }
    }

    const isPreferredThemeNotActive = activeTheme?.identifier !== themeIdentifier

    const isDefaultThemePreferredAndNotActive =
      themeIdentifier === DefaultThemeIdentifier && activeTheme

    if (isPreferredThemeNotActive || isDefaultThemePreferredAndNotActive) {
      this.showColorSchemeToast(setTheme)
    }
  }

  private async activateCachedThemes() {
    const cachedThemes = await this.getCachedThemes()
    for (const theme of cachedThemes) {
      this.activateTheme(theme, true)
    }
  }

  private registerObservers() {
    this.unregisterDesktop = this.webApplication
      .getDesktopService()
      .registerUpdateObserver((component) => {
        if (component.active && component.isTheme()) {
          this.deactivateTheme(component.uuid)
          setTimeout(() => {
            this.activateTheme(component as SNTheme)
            this.cacheThemeState().catch(console.error)
          }, 10)
        }
      })

    this.unregisterStream = this.application.streamItems(
      ContentType.Theme,
      ({ changed, inserted, source }) => {
        const items = changed.concat(inserted)
        const themes = items as SNTheme[]
        for (const theme of themes) {
          if (theme.active) {
            this.activateTheme(theme)
          } else {
            this.deactivateTheme(theme.uuid)
          }
        }
        if (source !== PayloadSource.LocalRetrieved) {
          this.cacheThemeState().catch(console.error)
        }
      },
    )
  }

  public deactivateAllThemes() {
    const activeThemes = this.activeThemes.slice()
    for (const uuid of activeThemes) {
      this.deactivateTheme(uuid)
    }
  }

  private activateTheme(theme: SNTheme, skipEntitlementCheck = false) {
    if (this.activeThemes.find((uuid) => uuid === theme.uuid)) {
      return
    }

    if (
      !skipEntitlementCheck &&
      this.application.features.getFeatureStatus(theme.identifier) !== FeatureStatus.Entitled
    ) {
      return
    }

    const url = this.application.componentManager.urlForComponent(theme)
    if (!url) {
      return
    }

    this.activeThemes.push(theme.uuid)

    const link = document.createElement('link')
    link.href = url
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.media = 'screen,print'
    link.id = theme.uuid
    document.getElementsByTagName('head')[0].appendChild(link)
  }

  private deactivateTheme(uuid: string) {
    const element = document.getElementById(uuid) as HTMLLinkElement
    if (element) {
      element.disabled = true
      element.parentNode?.removeChild(element)
    }

    removeFromArray(this.activeThemes, uuid)
  }

  private async cacheThemeState() {
    const themes = this.application.items.findItems(this.activeThemes) as SNTheme[]

    const mapped = themes.map((theme) => {
      const payload = theme.payloadRepresentation()
      return CreateDecryptedLocalStorageContextPayload(payload)
    })

    return this.application.setValue(CachedThemesKey, mapped, StorageValueModes.Nonwrapped)
  }

  private async getCachedThemes() {
    const cachedThemes = (await this.application.getValue(
      CachedThemesKey,
      StorageValueModes.Nonwrapped,
    )) as SNTheme[]
    if (cachedThemes) {
      const themes = []
      for (const cachedTheme of cachedThemes) {
        const payload = this.application.items.createPayloadFromObject(cachedTheme)
        const theme = this.application.items.createItemFromPayload(payload) as SNTheme
        themes.push(theme)
      }
      return themes
    } else {
      return []
    }
  }
}
