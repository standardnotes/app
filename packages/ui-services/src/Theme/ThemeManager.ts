import { dismissToast, ToastType, addTimedToast } from '@standardnotes/toast'
import {
  UIFeature,
  CreateDecryptedLocalStorageContextPayload,
  LocalStorageDecryptedContextualPayload,
  PrefKey,
  ThemeInterface,
} from '@standardnotes/models'
import {
  InternalEventBusInterface,
  ApplicationEvent,
  StorageValueModes,
  FeatureStatus,
  PreferenceServiceInterface,
  PreferencesServiceEvent,
  ComponentManagerInterface,
} from '@standardnotes/services'
import { NativeFeatureIdentifier, FindNativeTheme, ThemeFeatureDescription } from '@standardnotes/features'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'
import { AbstractUIServicee } from '../Abstract/AbstractUIService'
import { GetAllThemesUseCase } from './GetAllThemesUseCase'
import { Uuid } from '@standardnotes/domain-core'
import { ActiveThemeList } from './ActiveThemeList'

const CachedThemesKey = 'cachedThemes'
const TimeBeforeApplyingColorScheme = 5
const DefaultThemeIdentifier = 'Default'

export class ThemeManager extends AbstractUIServicee {
  private themesActiveInTheUI: ActiveThemeList
  private lastUseDeviceThemeSettings = false

  constructor(
    application: WebApplicationInterface,
    private preferences: PreferenceServiceInterface,
    private components: ComponentManagerInterface,
    internalEventBus: InternalEventBusInterface,
  ) {
    super(application, internalEventBus)
    this.colorSchemeEventHandler = this.colorSchemeEventHandler.bind(this)
    this.themesActiveInTheUI = new ActiveThemeList(application.items)
  }

  override deinit() {
    this.themesActiveInTheUI.clear()
    ;(this.themesActiveInTheUI as unknown) = undefined
    ;(this.preferences as unknown) = undefined
    ;(this.components as unknown) = undefined

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    if (mq.removeEventListener != undefined) {
      mq.removeEventListener('change', this.colorSchemeEventHandler)
    } else {
      mq.removeListener(this.colorSchemeEventHandler)
    }

    super.deinit()
  }

  override async onAppStart() {
    const desktopService = this.application.getDesktopService()
    if (desktopService) {
      this.eventDisposers.push(
        desktopService.registerUpdateObserver((component) => {
          const uiFeature = new UIFeature<ThemeFeatureDescription>(component)
          if (uiFeature.isThemeComponent) {
            if (this.components.isThemeActive(uiFeature)) {
              this.deactivateThemeInTheUI(uiFeature.uniqueIdentifier)
              setTimeout(() => {
                this.activateTheme(uiFeature)
                this.cacheThemeState().catch(console.error)
              }, 10)
            }
          }
        }),
      )
    }

    this.eventDisposers.push(
      this.preferences.addEventObserver(async (event) => {
        if (event !== PreferencesServiceEvent.PreferencesChanged) {
          return
        }

        let hasChange = false

        const { features, uuids } = this.components.getActiveThemesIdentifiers()

        const featuresList = new ActiveThemeList(this.application.items, features)
        const uuidsList = new ActiveThemeList(this.application.items, uuids)

        for (const active of this.themesActiveInTheUI.getList()) {
          if (!featuresList.has(active) && !uuidsList.has(active)) {
            this.deactivateThemeInTheUI(active)
            hasChange = true
          }
        }

        for (const feature of features) {
          if (!this.themesActiveInTheUI.has(feature)) {
            const theme = FindNativeTheme(feature.value)
            if (theme) {
              const uiFeature = new UIFeature<ThemeFeatureDescription>(theme)
              this.activateTheme(uiFeature)
              hasChange = true
            }
          }
        }

        for (const uuid of uuids) {
          if (!this.themesActiveInTheUI.has(uuid)) {
            const theme = this.application.items.findItem<ThemeInterface>(uuid.value)
            if (theme) {
              const uiFeature = new UIFeature<ThemeFeatureDescription>(theme)
              this.activateTheme(uiFeature)
              hasChange = true
            }
          }
        }

        if (hasChange) {
          this.cacheThemeState().catch(console.error)
        }
      }),
    )
  }

  override async onAppEvent(event: ApplicationEvent) {
    switch (event) {
      case ApplicationEvent.SignedOut: {
        this.deactivateAllThemes()
        this.themesActiveInTheUI.clear()
        this.application?.removeValue(CachedThemesKey, StorageValueModes.Nonwrapped).catch(console.error)
        break
      }
      case ApplicationEvent.StorageReady: {
        await this.activateCachedThemes()
        break
      }
      case ApplicationEvent.FeaturesAvailabilityChanged: {
        this.handleFeaturesAvailabilityChanged()
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

  private handleFeaturesAvailabilityChanged(): void {
    let hasChange = false

    for (const theme of this.themesActiveInTheUI.asThemes()) {
      const status = this.application.features.getFeatureStatus(theme.uniqueIdentifier)
      if (status !== FeatureStatus.Entitled) {
        this.deactivateThemeInTheUI(theme.uniqueIdentifier)
        hasChange = true
      }
    }

    const activeThemes = this.components.getActiveThemes()

    for (const theme of activeThemes) {
      if (!this.themesActiveInTheUI.has(theme.uniqueIdentifier)) {
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
      preference === PrefKey.AutoDarkThemeIdentifier ? NativeFeatureIdentifier.TYPES.DarkTheme : DefaultThemeIdentifier

    const usecase = new GetAllThemesUseCase(this.application.items)
    const { thirdParty, native } = usecase.execute({ excludeLayerable: false })
    const themes = [...thirdParty, ...native]

    const activeTheme = themes.find((theme) => this.components.isThemeActive(theme) && !theme.layerable)

    const activeThemeIdentifier = activeTheme ? activeTheme.featureIdentifier : DefaultThemeIdentifier

    const themeIdentifier = this.preferences.getValue(preference, preferenceDefault)

    const toggleActiveTheme = () => {
      if (activeTheme) {
        void this.components.toggleTheme(activeTheme)
      }
    }

    const setTheme = () => {
      if (themeIdentifier === DefaultThemeIdentifier) {
        toggleActiveTheme()
      } else {
        const theme = themes.find((theme) => theme.featureIdentifier === themeIdentifier)
        if (theme && !this.components.isThemeActive(theme)) {
          this.components.toggleTheme(theme).catch(console.error)
        }
      }
    }

    const isPreferredThemeNotActive = activeThemeIdentifier !== themeIdentifier

    if (isPreferredThemeNotActive) {
      this.showColorSchemeToast(setTheme)
    }
  }

  private async activateCachedThemes() {
    const cachedThemes = this.getCachedThemes()
    for (const theme of cachedThemes) {
      this.activateTheme(theme, true)
    }
  }

  private deactivateAllThemes() {
    const activeThemes = this.themesActiveInTheUI.getList()
    for (const uuid of activeThemes) {
      this.deactivateThemeInTheUI(uuid)
    }
  }

  private activateTheme(theme: UIFeature<ThemeFeatureDescription>, skipEntitlementCheck = false) {
    if (this.themesActiveInTheUI.has(theme.uniqueIdentifier)) {
      return
    }

    if (
      !skipEntitlementCheck &&
      this.application.features.getFeatureStatus(theme.uniqueIdentifier) !== FeatureStatus.Entitled
    ) {
      return
    }

    const url = this.application.componentManager.urlForFeature(theme)
    if (!url) {
      return
    }

    this.themesActiveInTheUI.add(theme.uniqueIdentifier)

    const link = document.createElement('link')
    link.href = url
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.media = 'screen,print'
    link.id = theme.uniqueIdentifier.value
    link.onload = () => {
      this.syncThemeColorMetadata()

      if (this.application.isNativeMobileWeb()) {
        const packageInfo = theme.featureDescription
        setTimeout(() => {
          this.application
            .mobileDevice()
            .handleThemeSchemeChange(packageInfo.isDark ?? false, this.getBackgroundColor())
        })
      }
    }
    document.getElementsByTagName('head')[0].appendChild(link)
  }

  private deactivateThemeInTheUI(id: NativeFeatureIdentifier | Uuid) {
    if (!this.themesActiveInTheUI.has(id)) {
      return
    }

    const element = document.getElementById(id.value) as HTMLLinkElement
    if (element) {
      element.disabled = true
      element.parentNode?.removeChild(element)
    }

    this.themesActiveInTheUI.remove(id)

    if (this.themesActiveInTheUI.isEmpty() && this.application.isNativeMobileWeb()) {
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
    const themes = this.themesActiveInTheUI.asThemes()

    const mapped = themes.map((theme) => {
      if (theme.isComponent) {
        const payload = theme.asComponent.payloadRepresentation()
        return CreateDecryptedLocalStorageContextPayload(payload)
      } else {
        const payload = theme.asFeatureDescription
        return payload
      }
    })

    return this.application.setValue(CachedThemesKey, mapped, StorageValueModes.Nonwrapped)
  }

  private getCachedThemes(): UIFeature<ThemeFeatureDescription>[] {
    const cachedThemes = this.application.getValue<LocalStorageDecryptedContextualPayload[]>(
      CachedThemesKey,
      StorageValueModes.Nonwrapped,
    )

    if (!cachedThemes) {
      return []
    }

    const features: UIFeature<ThemeFeatureDescription>[] = []

    for (const cachedTheme of cachedThemes) {
      if ('uuid' in cachedTheme) {
        const payload = this.application.items.createPayloadFromObject(cachedTheme)
        const theme = this.application.items.createItemFromPayload<ThemeInterface>(payload)
        features.push(new UIFeature<ThemeFeatureDescription>(theme))
      } else if ('identifier' in cachedTheme) {
        const feature = FindNativeTheme((cachedTheme as ThemeFeatureDescription).identifier)
        if (feature) {
          features.push(new UIFeature<ThemeFeatureDescription>(feature))
        }
      }
    }

    return features
  }
}
