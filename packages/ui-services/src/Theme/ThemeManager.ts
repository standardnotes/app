import {
  UIFeature,
  CreateDecryptedLocalStorageContextPayload,
  LocalStorageDecryptedContextualPayload,
  PrefDefaults,
  ComponentInterface,
} from '@standardnotes/models'
import {
  InternalEventBusInterface,
  ApplicationEvent,
  StorageValueModes,
  FeatureStatus,
  PreferenceServiceInterface,
  ComponentManagerInterface,
  LocalPrefKey,
} from '@standardnotes/services'
import { NativeFeatureIdentifier, FindNativeTheme, ThemeFeatureDescription } from '@standardnotes/features'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'
import { AbstractUIService } from '../Abstract/AbstractUIService'
import { GetAllThemesUseCase } from './GetAllThemesUseCase'
import { Uuid } from '@standardnotes/domain-core'
import { ActiveThemeList } from './ActiveThemeList'
import { Color } from './Color'

const CachedThemesKey = 'cachedThemes'
const DefaultThemeIdentifier = 'Default'

export class ThemeManager extends AbstractUIService {
  private themesActiveInTheUI: ActiveThemeList
  private lastUseDeviceThemeSettings: boolean | undefined
  private lastAutoLightTheme: string | undefined
  private lastAutoDarkTheme: string | undefined

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
    const desktopService = this.application.desktopManager
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
        this.handleFeaturesAvailabilityChanged().catch(console.error)
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
      case ApplicationEvent.LocalPreferencesChanged: {
        void this.handleLocalPreferencesChangeEvent()
        break
      }
    }
  }

  async handleMobileColorSchemeChangeEvent() {
    const useDeviceThemeSettings = this.preferences.getLocalValue(LocalPrefKey.UseSystemColorScheme, false)

    if (useDeviceThemeSettings) {
      const prefersDarkColorScheme = (await this.application.mobileDevice.getColorScheme()) === 'dark'
      this.setThemeAsPerColorScheme(prefersDarkColorScheme)
    }
  }

  private handleThemeStateChange() {
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
        const theme = this.application.items.findItem<ComponentInterface>(uuid.value)
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
  }

  private async handleLocalPreferencesChangeEvent() {
    this.handleThemeStateChange()

    this.toggleTranslucentUIColors()

    const useSystemColorScheme = this.preferences.getLocalValue(LocalPrefKey.UseSystemColorScheme, false)
    const autoLightTheme = this.preferences.getLocalValue(LocalPrefKey.AutoLightThemeIdentifier, DefaultThemeIdentifier)
    const autoDarkTheme = this.preferences.getLocalValue(
      LocalPrefKey.AutoDarkThemeIdentifier,
      NativeFeatureIdentifier.TYPES.DarkTheme,
    )

    const hasPreferenceChanged =
      useSystemColorScheme !== this.lastUseDeviceThemeSettings ||
      autoLightTheme !== this.lastAutoLightTheme ||
      autoDarkTheme !== this.lastAutoDarkTheme

    if (hasPreferenceChanged) {
      this.lastUseDeviceThemeSettings = useSystemColorScheme
      this.lastAutoLightTheme = autoLightTheme
      this.lastAutoDarkTheme = autoDarkTheme
    }

    if (hasPreferenceChanged && useSystemColorScheme) {
      let prefersDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches

      if (this.application.isNativeMobileWeb()) {
        prefersDarkColorScheme = (await this.application.mobileDevice.getColorScheme()) === 'dark'
      }

      this.setThemeAsPerColorScheme(prefersDarkColorScheme)
    }
  }

  private async handleFeaturesAvailabilityChanged() {
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

    const shouldSetThemeAsPerColorScheme = this.preferences.getLocalValue(LocalPrefKey.UseSystemColorScheme, false)
    if (shouldSetThemeAsPerColorScheme) {
      let prefersDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (this.application.isNativeMobileWeb()) {
        prefersDarkColorScheme = (await this.application.mobileDevice.getColorScheme()) === 'dark'
      }
      hasChange = this.setThemeAsPerColorScheme(prefersDarkColorScheme)
    }

    if (hasChange) {
      void this.cacheThemeState()
    }
  }

  private colorSchemeEventHandler(event: MediaQueryListEvent) {
    const shouldChangeTheme = this.preferences.getLocalValue(LocalPrefKey.UseSystemColorScheme, false)

    if (shouldChangeTheme) {
      this.setThemeAsPerColorScheme(event.matches)
    }
  }

  private setThemeAsPerColorScheme(prefersDarkColorScheme: boolean): boolean {
    let didChangeTheme = false

    const preference = prefersDarkColorScheme
      ? LocalPrefKey.AutoDarkThemeIdentifier
      : LocalPrefKey.AutoLightThemeIdentifier

    const preferenceDefault =
      preference === LocalPrefKey.AutoDarkThemeIdentifier
        ? NativeFeatureIdentifier.TYPES.DarkTheme
        : DefaultThemeIdentifier

    const usecase = new GetAllThemesUseCase(this.application.items)
    const { thirdParty, native } = usecase.execute({ excludeLayerable: false })
    const themes = [...thirdParty, ...native]

    const activeTheme = themes.find((theme) => this.components.isThemeActive(theme) && !theme.layerable)

    const themeIdentifier = this.preferences.getLocalValue(preference, preferenceDefault)

    const toggleActiveTheme = () => {
      if (activeTheme) {
        void this.components.toggleTheme(activeTheme)
        didChangeTheme = true
      }
    }

    if (themeIdentifier === DefaultThemeIdentifier) {
      toggleActiveTheme()
    } else {
      const theme = themes.find((theme) => theme.featureIdentifier === themeIdentifier)
      if (theme) {
        if (!this.components.isThemeActive(theme)) {
          this.components.toggleTheme(theme, true).catch(console.error)
        } else {
          this.components.toggleOtherNonLayerableThemes(theme)
        }
        didChangeTheme = true
      }
    }

    return didChangeTheme
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
        setTimeout(() => {
          const backgroundColorString = this.getBackgroundColor()
          const backgroundColor = new Color(backgroundColorString)
          this.application.mobileDevice.handleThemeSchemeChange(backgroundColor.isDark(), backgroundColorString)
        })
      }

      this.toggleTranslucentUIColors()
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

    if (this.themesActiveInTheUI.isEmpty()) {
      if (this.application.isNativeMobileWeb()) {
        this.application.mobileDevice.handleThemeSchemeChange(false, '#ffffff')
      }
      this.toggleTranslucentUIColors()
    }
  }

  private getBackgroundColor() {
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--sn-stylekit-background-color').trim()
    return bgColor.length ? bgColor : '#ffffff'
  }

  private shouldUseTranslucentUI() {
    return this.preferences.getLocalValue(LocalPrefKey.UseTranslucentUI, PrefDefaults[LocalPrefKey.UseTranslucentUI])
  }

  private toggleTranslucentUIColors() {
    if (!this.shouldUseTranslucentUI()) {
      document.documentElement.style.removeProperty('--popover-background-color')
      document.documentElement.style.removeProperty('--popover-backdrop-filter')
      document.body.classList.remove('translucent-ui')
      return
    }
    try {
      const backgroundColor = new Color(this.getBackgroundColor())
      const backdropFilter = backgroundColor.isDark()
        ? 'blur(12px) saturate(190%) contrast(70%) brightness(80%)'
        : 'blur(12px) saturate(190%) contrast(50%) brightness(130%)'
      const translucentBackgroundColor = backgroundColor.setAlpha(0.65).toString()
      document.documentElement.style.setProperty('--popover-background-color', translucentBackgroundColor)
      document.documentElement.style.setProperty('--popover-backdrop-filter', backdropFilter)
      document.body.classList.add('translucent-ui')
    } catch (error) {
      console.error(error)
    }
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
        const theme = this.application.items.createItemFromPayload<ComponentInterface>(payload)
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
