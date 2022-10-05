import { dismissToast, ToastType, addTimedToast } from '@standardnotes/toast'
import { ContentType, Uuid } from '@standardnotes/common'
import {
  CreateDecryptedLocalStorageContextPayload,
  LocalStorageDecryptedContextualPayload,
  PayloadEmitSource,
  PrefKey,
  SNTheme,
} from '@standardnotes/models'
import { removeFromArray } from '@standardnotes/utils'
import {
  AbstractService,
  WebApplicationInterface,
  InternalEventBusInterface,
  ApplicationEvent,
  StorageValueModes,
  FeatureStatus,
} from '@standardnotes/services'

const CachedThemesKey = 'cachedThemes'
const TimeBeforeApplyingColorScheme = 5
const DefaultThemeIdentifier = 'Default'
const DarkThemeIdentifier = 'Dark'

export class ThemeManager extends AbstractService {
  private activeThemes: Uuid[] = []
  private unregisterDesktop?: () => void
  private unregisterStream!: () => void
  private lastUseDeviceThemeSettings = false
  private unsubApp!: () => void

  constructor(
    protected application: WebApplicationInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.addAppEventObserverAfterSubclassesFinishConstructing()
    this.colorSchemeEventHandler = this.colorSchemeEventHandler.bind(this)
  }

  async onAppStart() {
    this.registerObservers()
  }

  async onAppEvent(event: ApplicationEvent) {
    switch (event) {
      case ApplicationEvent.SignedOut: {
        this.deactivateAllThemes()
        this.activeThemes = []
        this.application?.removeValue(CachedThemesKey, StorageValueModes.Nonwrapped).catch(console.error)
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
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.colorSchemeEventHandler)
        break
      }
      case ApplicationEvent.PreferencesChanged: {
        this.handlePreferencesChangeEvent()
        break
      }
    }
  }

  addAppEventObserverAfterSubclassesFinishConstructing() {
    setTimeout(() => {
      this.addAppEventObserver()
    }, 0)
  }

  addAppEventObserver() {
    if (this.application.isStarted()) {
      void this.onAppStart()
    }

    this.unsubApp = this.application.addEventObserver(async (event: ApplicationEvent) => {
      await this.onAppEvent(event)
      if (event === ApplicationEvent.Started) {
        void this.onAppStart()
      }
    })
  }

  private handlePreferencesChangeEvent(): void {
    const useDeviceThemeSettings = this.application.getPreference(PrefKey.UseSystemColorScheme, false)

    const hasPreferenceChanged = useDeviceThemeSettings !== this.lastUseDeviceThemeSettings

    if (hasPreferenceChanged) {
      this.lastUseDeviceThemeSettings = useDeviceThemeSettings
    }

    if (hasPreferenceChanged && useDeviceThemeSettings) {
      const prefersDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)')

      this.setThemeAsPerColorScheme(prefersDarkColorScheme.matches)
    }
  }

  get webApplication() {
    return this.application as WebApplicationInterface
  }

  override deinit() {
    this.activeThemes.length = 0

    this.unregisterDesktop?.()
    this.unregisterStream()
    ;(this.unregisterDesktop as unknown) = undefined
    ;(this.unregisterStream as unknown) = undefined

    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.colorSchemeEventHandler)
    ;(this.application as unknown) = undefined

    this.unsubApp()
    ;(this.unsubApp as unknown) = undefined

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
    const preference = prefersDarkColorScheme ? PrefKey.AutoDarkThemeIdentifier : PrefKey.AutoLightThemeIdentifier
    const preferenceDefault =
      preference === PrefKey.AutoDarkThemeIdentifier ? DarkThemeIdentifier : DefaultThemeIdentifier

    const themes = this.application.items
      .getDisplayableComponents()
      .filter((component) => component.isTheme()) as SNTheme[]

    const activeTheme = themes.find((theme) => theme.active && !theme.isLayerable())
    const activeThemeIdentifier = activeTheme
      ? activeTheme.identifier
      : this.application.getPreference(PrefKey.DarkMode, false)
      ? DarkThemeIdentifier
      : DefaultThemeIdentifier

    const themeIdentifier = this.application.getPreference(preference, preferenceDefault) as string

    const setTheme = () => {
      if (themeIdentifier === DefaultThemeIdentifier) {
        if (activeTheme) {
          void this.application.mutator.toggleTheme(activeTheme)
        }
        void this.application.setPreference(PrefKey.DarkMode, false)
      } else if (themeIdentifier === DarkThemeIdentifier) {
        if (activeTheme) {
          void this.application.mutator.toggleTheme(activeTheme)
        }
        void this.application.setPreference(PrefKey.DarkMode, true)
      } else {
        const theme = themes.find((theme) => theme.package_info.identifier === themeIdentifier)
        if (theme && !theme.active) {
          this.application.mutator.toggleTheme(theme).catch(console.error)
        }
      }
    }

    const isPreferredThemeNotActive = activeThemeIdentifier !== themeIdentifier

    if (isPreferredThemeNotActive) {
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
    this.unregisterDesktop = this.webApplication.getDesktopService()?.registerUpdateObserver((component) => {
      if (component.active && component.isTheme()) {
        this.deactivateTheme(component.uuid)
        setTimeout(() => {
          this.activateTheme(component as SNTheme)
          this.cacheThemeState().catch(console.error)
        }, 10)
      }
    })

    this.unregisterStream = this.application.streamItems(ContentType.Theme, ({ changed, inserted, source }) => {
      const items = changed.concat(inserted)
      const themes = items as SNTheme[]
      for (const theme of themes) {
        if (theme.active) {
          this.activateTheme(theme)
        } else {
          this.deactivateTheme(theme.uuid)
        }
      }

      if (source !== PayloadEmitSource.LocalRetrieved) {
        this.cacheThemeState().catch(console.error)
      }
    })
  }

  private deactivateAllThemes() {
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
    link.onload = () => {
      this.syncThemeColorMetadata()

      if (this.application.isNativeMobileWeb()) {
        setTimeout(() => {
          this.application
            .mobileDevice()
            .handleThemeSchemeChange(theme.package_info.isDark ?? false, this.getBackgroundColor())
        })
      }
    }
    document.getElementsByTagName('head')[0].appendChild(link)
  }

  private getBackgroundColor() {
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--sn-stylekit-background-color').trim()
    return bgColor.length ? bgColor : '#ffffff'
  }

  /**
   * Syncs the active theme's background color to the 'theme-color' meta tag
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name/theme-color
   */
  private syncThemeColorMetadata() {
    const themeColorMetaElement = document.querySelector('meta[name="theme-color"]')
    if (!themeColorMetaElement) {
      return
    }

    themeColorMetaElement.setAttribute('content', this.getBackgroundColor())
  }

  private deactivateTheme(uuid: string) {
    if (!this.activeThemes.includes(uuid)) {
      return
    }

    const element = document.getElementById(uuid) as HTMLLinkElement
    if (element) {
      element.disabled = true
      element.parentNode?.removeChild(element)
    }

    removeFromArray(this.activeThemes, uuid)

    if (this.activeThemes.length === 0 && this.application.isNativeMobileWeb()) {
      this.application.mobileDevice().handleThemeSchemeChange(false, '#ffffff')
    }
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
    )) as LocalStorageDecryptedContextualPayload[]

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
