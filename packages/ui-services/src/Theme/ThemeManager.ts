import { dismissToast, ToastType, addTimedToast } from '@standardnotes/toast'
import {
  CreateDecryptedLocalStorageContextPayload,
  LocalStorageDecryptedContextualPayload,
  PrefKey,
  SNTheme,
} from '@standardnotes/models'
import { removeFromArray } from '@standardnotes/utils'
import {
  InternalEventBusInterface,
  ApplicationEvent,
  StorageValueModes,
  FeatureStatus,
  PreferenceServiceInterface,
  PreferencesServiceEvent,
} from '@standardnotes/services'
import { FeatureIdentifier } from '@standardnotes/features'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'
import { AbstractUIServicee } from '../Abstract/AbstractUIService'

const CachedThemesKey = 'cachedThemes'
const TimeBeforeApplyingColorScheme = 5
const DefaultThemeIdentifier = 'Default'

export class ThemeManager extends AbstractUIServicee {
  private themesActiveInTheUI: string[] = []
  private lastUseDeviceThemeSettings = false

  constructor(
    application: WebApplicationInterface,
    private preferences: PreferenceServiceInterface,
    internalEventBus: InternalEventBusInterface,
  ) {
    super(application, internalEventBus)
    this.colorSchemeEventHandler = this.colorSchemeEventHandler.bind(this)
  }

  override async onAppStart() {
    const desktopService = this.application.getDesktopService()
    if (desktopService) {
      this.eventDisposers.push(
        desktopService.registerUpdateObserver((component) => {
          if (component.isTheme()) {
            if (this.preferences.isThemeActive(component as SNTheme)) {
              this.deactivateThemeInTheUI(component.uuid)
              setTimeout(() => {
                this.activateTheme(component as SNTheme)
                this.cacheThemeState().catch(console.error)
              }, 10)
            }
          }
        }),
      )
    }

    this.eventDisposers.push(
      this.preferences.addEventObserver(async (event) => {
        if (event === PreferencesServiceEvent.PreferencesChanged) {
          let hasChange = false
          const activeThemes = this.preferences.getActiveThemesIdentifiers()
          for (const uiActiveTheme of this.themesActiveInTheUI) {
            if (!activeThemes.includes(uiActiveTheme)) {
              this.deactivateThemeInTheUI(uiActiveTheme)
              hasChange = true
            }
          }

          for (const activeTheme of activeThemes) {
            if (!this.themesActiveInTheUI.includes(activeTheme)) {
              const theme = this.application.items.findItem<SNTheme>(activeTheme)
              if (theme) {
                this.activateTheme(theme)
                hasChange = true
              }
            }
          }

          if (hasChange) {
            this.cacheThemeState().catch(console.error)
          }
        }
      }),
    )
  }

  override async onAppEvent(event: ApplicationEvent) {
    switch (event) {
      case ApplicationEvent.SignedOut: {
        this.deactivateAllThemes()
        this.themesActiveInTheUI = []
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
        if (!this.application.isNativeMobileWeb()) {
          const mq = window.matchMedia('(prefers-color-scheme: dark)')
          if (mq.addEventListener != undefined) {
            mq.addEventListener('change', this.colorSchemeEventHandler)
          } else {
            mq.addListener(this.colorSchemeEventHandler)
          }
        }
        break
      }
      case ApplicationEvent.PreferencesChanged: {
        void this.handlePreferencesChangeEvent()
        break
      }
    }
  }

  async handleMobileColorSchemeChangeEvent() {
    const useDeviceThemeSettings = this.application.getPreference(PrefKey.UseSystemColorScheme, false)

    if (useDeviceThemeSettings) {
      const prefersDarkColorScheme = (await this.application.mobileDevice().getColorScheme()) === 'dark'
      this.setThemeAsPerColorScheme(prefersDarkColorScheme)
    }
  }

  private async handlePreferencesChangeEvent() {
    const useDeviceThemeSettings = this.application.getPreference(PrefKey.UseSystemColorScheme, false)

    const hasPreferenceChanged = useDeviceThemeSettings !== this.lastUseDeviceThemeSettings

    if (hasPreferenceChanged) {
      this.lastUseDeviceThemeSettings = useDeviceThemeSettings
    }

    if (hasPreferenceChanged && useDeviceThemeSettings) {
      let prefersDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches

      if (this.application.isNativeMobileWeb()) {
        prefersDarkColorScheme = (await this.application.mobileDevice().getColorScheme()) === 'dark'
      }

      this.setThemeAsPerColorScheme(prefersDarkColorScheme)
    }
  }

  override deinit() {
    this.themesActiveInTheUI = []

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    if (mq.removeEventListener != undefined) {
      mq.removeEventListener('change', this.colorSchemeEventHandler)
    } else {
      mq.removeListener(this.colorSchemeEventHandler)
    }

    super.deinit()
  }

  private handleFeaturesUpdated(): void {
    let hasChange = false

    for (const themeUuid of this.themesActiveInTheUI) {
      const theme = this.application.items.findItem<SNTheme>(themeUuid)

      if (!theme) {
        this.deactivateThemeInTheUI(themeUuid)
        hasChange = true

        continue
      }

      const status = this.application.features.getFeatureStatus(theme.identifier)
      if (status !== FeatureStatus.Entitled) {
        this.deactivateThemeInTheUI(theme.uuid)
        hasChange = true
      }
    }

    const activeThemes = this.preferences.getActiveThemes()

    for (const theme of activeThemes) {
      if (!this.themesActiveInTheUI.includes(theme.uuid)) {
        this.activateTheme(theme)
        hasChange = true
      }
    }

    if (hasChange) {
      void this.cacheThemeState()
    }
  }

  private colorSchemeEventHandler(event: MediaQueryListEvent) {
    const shouldChangeTheme = this.application.getPreference(PrefKey.UseSystemColorScheme, false)

    if (shouldChangeTheme) {
      this.setThemeAsPerColorScheme(event.matches)
    }
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
      preference === PrefKey.AutoDarkThemeIdentifier ? FeatureIdentifier.DarkTheme : DefaultThemeIdentifier

    const themes = this.application.items
      .getDisplayableComponents()
      .filter((component) => component.isTheme()) as SNTheme[]

    const activeTheme = themes.find((theme) => this.preferences.isThemeActive(theme) && !theme.layerable)
    const activeThemeIdentifier = activeTheme ? activeTheme.identifier : DefaultThemeIdentifier

    const themeIdentifier = this.application.getPreference(preference, preferenceDefault) as string

    const toggleActiveTheme = () => {
      if (activeTheme) {
        void this.application.componentManager.toggleTheme(activeTheme)
      }
    }

    const setTheme = () => {
      if (themeIdentifier === DefaultThemeIdentifier) {
        toggleActiveTheme()
      } else {
        const theme = themes.find((theme) => theme.package_info.identifier === themeIdentifier)
        if (theme && !this.preferences.isThemeActive(theme)) {
          this.application.componentManager.toggleTheme(theme).catch(console.error)
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

  private deactivateAllThemes() {
    const activeThemes = this.themesActiveInTheUI.slice()

    for (const uuid of activeThemes) {
      this.deactivateThemeInTheUI(uuid)
    }
  }

  private activateTheme(theme: SNTheme, skipEntitlementCheck = false) {
    if (this.themesActiveInTheUI.find((uuid) => uuid === theme.uuid)) {
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

    this.themesActiveInTheUI.push(theme.uuid)

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

  private deactivateThemeInTheUI(uuid: string) {
    if (!this.themesActiveInTheUI.includes(uuid)) {
      return
    }

    const element = document.getElementById(uuid) as HTMLLinkElement
    if (element) {
      element.disabled = true
      element.parentNode?.removeChild(element)
    }

    removeFromArray(this.themesActiveInTheUI, uuid)

    if (this.themesActiveInTheUI.length === 0 && this.application.isNativeMobileWeb()) {
      this.application.mobileDevice().handleThemeSchemeChange(false, '#ffffff')
    }
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

  private async cacheThemeState() {
    const themes = this.application.items.findItems(this.themesActiveInTheUI) as SNTheme[]

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
