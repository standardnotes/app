import { MobileApplication } from '@Lib/Application'
import {
  ApplicationEvent,
  ComponentContent,
  ContentType,
  DecryptedPayload,
  DecryptedTransferPayload,
  FillItemContent,
  removeFromArray,
  SNTheme,
  StorageValueModes,
  UuidString,
} from '@standardnotes/snjs'
import React from 'react'
import { Alert, Appearance, Platform, StatusBar, TextStyle, ViewStyle } from 'react-native'
import CSSParser from './CssParser'
import { MobileTheme } from './MobileTheme'
import THEME_DARK_JSON from './Themes/blue-dark.json'
import THEME_BLUE_JSON from './Themes/blue.json'
import THEME_RED_JSON from './Themes/red.json'
import { MobileThemeVariables } from './Themes/styled-components'
import { DARK_CONTENT, getColorLuminosity, keyboardColorForTheme, LIGHT_CONTENT, statusBarColorForTheme } from './Utils'

const LIGHT_THEME_KEY = 'lightThemeKey'
const DARK_THEME_KEY = 'darkThemeKey'
const CACHED_THEMES_KEY = 'cachedThemesKey'

type ThemeChangeObserver = () => Promise<void> | void

type ThemeVariables = Record<string, string>

enum SystemThemeTint {
  Blue = 'Blue',
  Dark = 'Dark',
  Red = 'Red',
}

export const ThemeServiceContext = React.createContext<ThemeService | undefined>(undefined)

/**
 * Components might use current theme by using of two ways:
 * - use ThemeServiceContext
 * - use current theme injected into styled components
 */
export class ThemeService {
  observers: ThemeChangeObserver[] = []
  private themes: Record<UuidString, MobileTheme> = {}
  activeThemeId?: string
  static constants = {
    mainTextFontSize: 16,
    paddingLeft: 14,
  }
  styles: Record<string, ViewStyle | TextStyle> = {}
  variables?: MobileThemeVariables
  application?: MobileApplication
  unregisterComponentHandler?: () => void
  unsubscribeStreamThemes?: () => void
  unsubsribeAppEventObserver?: () => void

  constructor(application: MobileApplication) {
    this.application = application
    this.buildSystemThemesAndData()
    this.registerObservers()
  }

  async init() {
    await this.loadCachedThemes()
    await this.resolveInitialThemeForMode()
    Appearance.addChangeListener(this.onColorSchemeChange.bind(this))
  }

  deinit() {
    this.application = undefined
    Appearance.removeChangeListener(this.onColorSchemeChange.bind(this))
    this.unregisterComponentHandler && this.unregisterComponentHandler()
    this.unsubscribeStreamThemes && this.unsubscribeStreamThemes()
    this.unsubsribeAppEventObserver && this.unsubsribeAppEventObserver()
  }

  private registerObservers() {
    this.unsubsribeAppEventObserver = this.application?.addEventObserver(async (event) => {
      /**
       * If there are any migrations we need to set default theme to start UI
       */
      if (event === ApplicationEvent.MigrationsLoaded) {
        if (await this.application?.hasPendingMigrations()) {
          this.setDefaultTheme()
        }
      }
      if (event === ApplicationEvent.Launched) {
        // Resolve initial theme after app launched
        void this.resolveInitialThemeForMode()
      }
    })
  }

  private findOrCreateTheme(themeId: string, variables?: MobileThemeVariables) {
    let theme = this.themes[themeId]
    if (!theme) {
      theme = this.buildTheme(undefined, variables)
      this.addTheme(theme)
    }
    return theme
  }

  private buildSystemThemesAndData() {
    const themeData = [
      {
        uuid: SystemThemeTint.Blue,
        variables: THEME_BLUE_JSON,
        name: SystemThemeTint.Blue,
        isInitial: this.getColorScheme() === 'light',
      },
      {
        uuid: SystemThemeTint.Dark,
        variables: THEME_DARK_JSON,
        name: SystemThemeTint.Dark,
        isInitial: this.getColorScheme() === 'dark',
      },
      {
        uuid: SystemThemeTint.Red,
        variables: THEME_RED_JSON,
        name: SystemThemeTint.Red,
      },
    ]

    for (const option of themeData) {
      const variables: MobileThemeVariables = {
        ...option.variables,
        ...ThemeService.constants,
      }
      variables.statusBar = Platform.OS === 'android' ? LIGHT_CONTENT : DARK_CONTENT

      const currentDate = new Date()
      const payload = new DecryptedPayload<ComponentContent>({
        uuid: option.uuid,
        content_type: ContentType.Theme,
        content: FillItemContent({
          package_info: {
            dock_icon: {
              type: 'circle',
              background_color: variables.stylekitInfoColor,
              border_color: variables.stylekitInfoColor,
            },
          },
          name: option.name,
          variables,
          luminosity: getColorLuminosity(variables.stylekitContrastBackgroundColor),
          isSystemTheme: true,
          isInitial: Boolean(option.isInitial),
        } as unknown as ComponentContent),
        created_at: currentDate,
        created_at_timestamp: currentDate.getTime(),
        updated_at: currentDate,
        updated_at_timestamp: currentDate.getTime(),
      })

      const theme = new MobileTheme(payload)

      this.addTheme(theme)
    }
  }

  addTheme(theme: MobileTheme) {
    this.themes[theme.uuid] = theme
  }

  public getActiveTheme() {
    return this.activeThemeId && this.themes[this.activeThemeId]
  }

  public isLikelyUsingDarkColorTheme() {
    const activeTheme = this.getActiveTheme()
    if (!activeTheme) {
      return false
    }

    return activeTheme.uuid !== SystemThemeTint.Blue
  }

  private onColorSchemeChange() {
    void this.resolveInitialThemeForMode()
  }

  /**
   * Returns color scheme or light scheme as a default
   */
  private getColorScheme() {
    return Appearance.getColorScheme() || 'light'
  }

  /**
   * Registers an observer for theme change
   * @returns function that unregisters this observer
   */
  public addThemeChangeObserver(callback: ThemeChangeObserver) {
    this.observers.push(callback)
    return () => {
      removeFromArray(this.observers, callback)
    }
  }

  notifyObserversOfThemeChange() {
    for (const observer of this.observers) {
      void observer()
    }
  }

  public async assignExternalThemeForMode(theme: SNTheme, mode: 'light' | 'dark') {
    const data = this.findOrCreateTheme(theme.uuid)
    if (!Object.prototype.hasOwnProperty.call(data, 'variables')) {
      if ((await this.downloadThemeAndReload(theme)) === false) {
        return
      }
    }
    void this.assignThemeForMode(theme.uuid, mode)
  }

  public async assignThemeForMode(themeId: string, mode: 'light' | 'dark') {
    void this.setThemeForMode(mode, themeId)

    /**
     * If we're changing the theme for a specific mode and we're currently on
     * that mode, then activate this theme.
     */
    if (this.getColorScheme() === mode && this.activeThemeId !== themeId) {
      this.activateTheme(themeId)
    }
  }

  private async setThemeForMode(mode: 'light' | 'dark', themeId: string) {
    return this.application?.setValue(
      mode === 'dark' ? DARK_THEME_KEY : LIGHT_THEME_KEY,
      themeId,
      StorageValueModes.Nonwrapped,
    )
  }

  public async getThemeForMode(mode: 'light' | 'dark') {
    return this.application?.getValue(mode === 'dark' ? DARK_THEME_KEY : LIGHT_THEME_KEY, StorageValueModes.Nonwrapped)
  }

  /**
   * When downloading an external theme, we can't depend on it having all the
   * variables present. So we will merge them with this template variable list
   * to make sure the end result has all variables the app expects. Return a
   * copy as the result may be modified before use.
   */
  templateVariables() {
    return Object.assign({}, THEME_BLUE_JSON) as MobileThemeVariables
  }

  private setDefaultTheme() {
    const defaultThemeId = this.getColorScheme() === 'dark' ? SystemThemeTint.Dark : SystemThemeTint.Blue

    this.setActiveTheme(defaultThemeId)
  }

  private async resolveInitialThemeForMode() {
    try {
      const savedThemeId = await this.getThemeForMode(this.getColorScheme())
      const matchingThemeId = Object.keys(this.themes).find((themeId) => themeId === savedThemeId)
      if (matchingThemeId) {
        this.setActiveTheme(matchingThemeId)
        void this.application?.mobileComponentManager.preloadThirdPartyThemeIndexPath()
      } else {
        this.setDefaultTheme()
      }
    } catch (e) {
      console.error('Error parsing initial theme', e)
      return this.setDefaultTheme()
    }
  }

  keyboardColorForActiveTheme() {
    return keyboardColorForTheme(this.findOrCreateTheme(this.activeThemeId!))
  }

  systemThemes() {
    return Object.values(this.themes)
      .filter((theme) => theme.mobileContent.isSystemTheme)
      .sort((a, b) => {
        if (a.name < b.name) {
          return -1
        }
        if (a.name > b.name) {
          return 1
        }
        return 0
      })
  }

  nonSystemThemes() {
    return Object.values(this.themes)
      .filter((theme) => !theme.mobileContent.isSystemTheme)
      .sort((a, b) => {
        if (a.name < b.name) {
          return -1
        }
        if (a.name > b.name) {
          return 1
        }
        return 0
      })
  }

  private buildTheme(base?: MobileTheme, baseVariables?: MobileThemeVariables) {
    const theme = base || MobileTheme.BuildTheme()
    /** Merge default variables to ensure this theme has all the variables. */
    const variables = {
      ...this.templateVariables(),
      ...theme.mobileContent.variables,
      ...baseVariables,
    }
    const luminosity = theme.mobileContent.luminosity || getColorLuminosity(variables.stylekitContrastBackgroundColor)
    return new MobileTheme(
      theme.payload.copy({
        content: {
          ...theme.mobileContent,
          variables,
          luminosity,
        } as unknown as ComponentContent,
      }),
    )
  }

  setActiveTheme(themeId: string) {
    const theme = this.findOrCreateTheme(themeId)
    const updatedTheme = this.buildTheme(theme)
    this.addTheme(updatedTheme)
    this.variables = updatedTheme.mobileContent.variables
    if (this.application?.isLaunched() && this.application.componentManager) {
      this.application.mobileComponentManager.setMobileActiveTheme(updatedTheme)
    }
    this.activeThemeId = themeId
    this.updateDeviceForTheme(themeId)
    this.notifyObserversOfThemeChange()
  }

  /**
   * Updates local device items for newly activated theme.
   *
   * This includes:
   *     - Status Bar color
   */
  private updateDeviceForTheme(themeId: string) {
    const theme = this.findOrCreateTheme(themeId)
    const isAndroid = Platform.OS === 'android'
    /** On Android, a time out is required, especially during app startup. */
    setTimeout(
      () => {
        const statusBarColor = statusBarColorForTheme(theme)
        StatusBar.setBarStyle(statusBarColor, true)

        if (isAndroid) {
          /**
           * Android <= v22 does not support changing status bar text color.
           * It will always be white, so we have to make sure background color
           * has proper contrast.
           */
          if (Platform.Version <= 22) {
            StatusBar.setBackgroundColor('#000000')
          } else {
            StatusBar.setBackgroundColor(theme.mobileContent.variables.stylekitContrastBackgroundColor)
          }
        }
      },
      isAndroid ? 100 : 0,
    )
  }

  private async downloadTheme(theme: SNTheme): Promise<ThemeVariables | undefined> {
    const componentManager = this.application?.mobileComponentManager
    if (componentManager?.isComponentDownloadable(theme)) {
      if (await componentManager.doesComponentNeedDownload(theme)) {
        await componentManager.downloadComponentOffline(theme)
      }

      const file = await componentManager.getIndexFile(theme.identifier)
      if (!file) {
        console.error(`Did not find local index file for ${theme.identifier}`)
        return undefined
      }
      const variables: ThemeVariables = CSSParser.cssToObject(file)
      if (!variables || Object.keys(variables).length === 0) {
        return undefined
      }
      return variables
    }

    let url = theme.hosted_url
    if (!url) {
      console.error('Theme download error')
      return
    }

    if (Platform.OS === 'android' && url.includes('localhost')) {
      url = url.replace('localhost', '10.0.2.2')
    }

    try {
      const response = await fetch(url!, {
        method: 'GET',
      })
      const data = await response.text()
      const variables: ThemeVariables = CSSParser.cssToObject(data)
      if (!variables || Object.keys(variables).length === 0) {
        return undefined
      }
      return variables
    } catch (e) {
      return undefined
    }
  }

  activateSystemTheme(themeId: string) {
    this.activateTheme(themeId)
  }

  async activateExternalTheme(theme: SNTheme) {
    const existing = this.themes[theme.uuid]
    if (existing && existing.mobileContent.variables) {
      this.activateTheme(theme.uuid)
      return
    }
    const variables = await this.downloadTheme(theme)
    if (!variables) {
      Alert.alert('Not Available', 'This theme is not available on mobile.')
      return
    }
    const appliedVariables = Object.assign(this.templateVariables(), variables)
    const finalVariables = {
      ...appliedVariables,
      ...ThemeService.constants,
    }
    const mobileTheme = new MobileTheme(
      theme.payload.copy({
        content: {
          ...theme.payload.content,
          variables: finalVariables,
          luminosity: getColorLuminosity(finalVariables.stylekitContrastBackgroundColor),
          isSystemTheme: false,
          isInitial: false,
          package_info: {
            ...theme.payload.content.package_info,
            dock_icon: {
              type: 'circle',
              background_color: finalVariables.stylekitInfoColor,
              border_color: finalVariables.stylekitInfoColor,
            },
          },
        } as unknown as ComponentContent,
      }),
    )
    this.addTheme(mobileTheme)
    this.activateTheme(theme.uuid)
    void this.cacheThemes()
  }

  private activateTheme(themeId: string) {
    this.setActiveTheme(themeId)
    void this.assignThemeForMode(themeId, this.getColorScheme())
  }

  private async loadCachedThemes() {
    const rawValue = (await this.application!.getValue(CACHED_THEMES_KEY, StorageValueModes.Nonwrapped)) || []

    const themes = (rawValue as DecryptedTransferPayload<ComponentContent>[]).map((rawPayload) => {
      const payload = new DecryptedPayload<ComponentContent>(rawPayload)

      return new MobileTheme(payload)
    })

    for (const theme of themes) {
      this.addTheme(theme)
    }
  }

  private async cacheThemes() {
    const themes = this.nonSystemThemes()
    return this.application!.setValue(
      CACHED_THEMES_KEY,
      themes.map((t) => t.payloadRepresentation()),
      StorageValueModes.Nonwrapped,
    )
  }

  public async downloadThemeAndReload(theme: SNTheme) {
    const variables = await this.downloadTheme(theme)
    if (!variables) {
      return false
    }
    /** Merge default variables to ensure this theme has all the variables. */
    const appliedVariables = Object.assign(this.templateVariables(), variables)
    const mobileTheme = this.findOrCreateTheme(theme.uuid, {
      ...appliedVariables,
      ...ThemeService.constants,
    })
    this.addTheme(mobileTheme)
    void this.cacheThemes()
    if (theme.uuid === this.activeThemeId) {
      this.setActiveTheme(theme.uuid)
    }
    return true
  }

  static doesDeviceSupportDarkMode() {
    /**
     * Android supportsDarkMode relies on a Configuration value in the API
     * that was not available until Android 8.0 (26)
     * https://developer.android.com/reference/android/content/res/Configuration#UI_MODE_NIGHT_UNDEFINED
     * iOS supports Dark mode from iOS 13
     */

    if (Platform.OS === 'android' && Platform.Version < 26) {
      return false
    } else if (Platform.OS === 'ios') {
      const majorVersionIOS = parseInt(Platform.Version as string, 10)
      return majorVersionIOS >= 13
    }

    return true
  }

  static platformIconPrefix() {
    return Platform.OS === 'android' ? 'md' : 'ios'
  }

  static nameForIcon(iconName: string) {
    return ThemeService.platformIconPrefix() + '-' + iconName
  }
}
