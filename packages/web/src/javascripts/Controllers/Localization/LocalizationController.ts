import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { DEFAULT_LOCALE, LOCALES_BASE_PATH, LocaleService, resolveLocale } from '@standardnotes/i18n'
import { configureDateLocale } from '@/Utils/DateLocale'
import { syncDesktopMainProcessLocalization } from '@/Application/Device/SyncDesktopMainProcessLocalization'
import { syncMobileNativeLocalization } from '@/Application/Device/SyncMobileNativeLocalization'
import { clearPersistedLocale, persistLocale } from '@/Utils/LocalePersistence'
import { isDesktopApplication } from '@/Utils'
import { addToast, ToastType } from '@standardnotes/toast'
import { LANGUAGE_PREFERENCES_SECTION_ID } from '@/Components/Preferences/Panes/General/Language'
import { RouteServiceInterface, RouteType } from '@standardnotes/ui-services'
import { c } from 'ttag'
import { action, makeObservable, observable, runInAction } from 'mobx'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  PrefDefaults,
  PrefKey,
  PreferenceServiceInterface,
} from '@standardnotes/snjs'

export class LocalizationController extends AbstractViewController implements InternalEventHandlerInterface {
  private localeService?: LocaleService

  labsSpotlightReady = false
  labsSpotlightOpen = false

  private labsSpotlightPrefLoaded = false

  constructor(
    private readonly featuresController: FeaturesController,
    private readonly getSavedLocale: () => string | undefined,
    private readonly preferences: PreferenceServiceInterface,
    private readonly preferencesController: PreferencesController,
    private readonly routeService: RouteServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      labsSpotlightReady: observable,
      labsSpotlightOpen: observable,
      dismissLabsSpotlight: action,
      openLanguageSettingsFromLabsSpotlight: action,
    })

    eventBus.addEventHandler(this, ApplicationEvent.FeaturesAvailabilityChanged)
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataLoaded)
    eventBus.addEventHandler(this, ApplicationEvent.PreferencesChanged)
    eventBus.addEventHandler(this, ApplicationEvent.Launched)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.LocalDataLoaded:
        this.labsSpotlightPrefLoaded = true
        await this.initializeLocalization()
        this.reconcileLabsSpotlight()
        break
      case ApplicationEvent.Launched:
        this.reconcileLabsSpotlight()
        break
      case ApplicationEvent.FeaturesAvailabilityChanged:
      case ApplicationEvent.PreferencesChanged:
        await this.initializeLocalization()
        this.reconcileLabsSpotlight()
        break
    }
  }

  dismissLabsSpotlight = (): void => {
    runInAction(() => {
      this.labsSpotlightReady = true
      this.labsSpotlightOpen = false
    })
    void this.preferences.setValue(PrefKey.HasSeenLocalizationLabsSpotlight, true)
  }

  openLanguageSettingsFromLabsSpotlight = (): void => {
    this.dismissLabsSpotlight()
    this.preferencesController.openPreferencesAndScrollToSection(LANGUAGE_PREFERENCES_SECTION_ID, 'general')
  }

  private hasSeenLocalizationLabsSpotlight(): boolean {
    return this.preferences.getValue(
      PrefKey.HasSeenLocalizationLabsSpotlight,
      PrefDefaults[PrefKey.HasSeenLocalizationLabsSpotlight],
    )
  }

  private reconcileLabsSpotlight(): void {
    if (!this.featuresController.isLocalizationFeatureAvailable()) {
      return
    }

    if (!this.labsSpotlightPrefLoaded) {
      return
    }

    runInAction(() => {
      this.labsSpotlightReady = true

      if (this.hasSeenLocalizationLabsSpotlight()) {
        this.labsSpotlightOpen = false
        return
      }

      if (this.featuresController.isLocalizationEnabled()) {
        this.labsSpotlightOpen = false
        return
      }

      const route = this.routeService.getRoute()
      if (route.type === RouteType.Purchase || route.type === RouteType.Settings) {
        this.labsSpotlightOpen = false
        return
      }

      this.labsSpotlightOpen = true
    })
  }

  async setLocale(locale: string): Promise<void> {
    if (!this.featuresController.isLocalizationEnabled()) {
      return
    }

    await this.getLocaleService().setLocale(locale)
  }

  async changeLocaleAndReload(locale: string): Promise<void> {
    if (locale === localizationStore.currentLocale) {
      return
    }

    if (!this.featuresController.isLocalizationEnabled()) {
      return
    }

    try {
      await this.loadLocale(locale)
    } catch (error) {
      console.error('Failed to load locale before reload', error)
      await this.fallbackToDefaultLocale()
      addToast({
        type: ToastType.Error,
        message: c('B6.Preferences.General.Language.Error').t`Could not load the selected language.`,
      })
      return
    }

    persistLocale(localizationStore.currentLocale)

    try {
      await this.preferences.setValue(PrefKey.Locale, localizationStore.currentLocale)
    } catch (error) {
      console.error('Failed to sync locale preference', error)
    }

    window.location.reload()
  }

  async enableLocalization(): Promise<void> {
    window.location.reload()
  }

  async disableLocalization(): Promise<void> {
    clearPersistedLocale()

    try {
      await this.preferences.setValue(PrefKey.Locale, PrefDefaults[PrefKey.Locale])
    } catch (error) {
      console.error('Failed to clear locale preference', error)
    }

    window.location.reload()
  }

  private async fallbackToDefaultLocale(): Promise<void> {
    const localeService = this.getLocaleService()
    await localeService.loadAndActivateLocale(DEFAULT_LOCALE)
    localizationStore.setCurrentLocale(localeService.getCurrentLocale())
    await this.syncDateFormatting(localeService.getCurrentLocale())
  }

  private async loadLocale(locale: string): Promise<void> {
    const localeService = this.getLocaleService()
    const catalog = await localeService.getAvailableLocales()
    const resolvedLocale = resolveLocale({
      savedLocale: locale,
      availableLocales: Object.keys(catalog),
    })

    await localeService.loadAndActivateLocale(resolvedLocale)
    localizationStore.setAvailableLocales(catalog)
    localizationStore.setCurrentLocale(localeService.getCurrentLocale())
    await this.syncDateFormatting(localeService.getCurrentLocale())
  }

  /** Desktop serves web from `web/`; the mobile shell serves the same dist under `web-src/`. */
  private webLocalesBasePath(): string {
    if (typeof window === 'undefined' || window.location.protocol !== 'file:') {
      return LOCALES_BASE_PATH
    }

    return isDesktopApplication() ? 'web/locales' : 'web-src/locales'
  }

  private shouldUseFileDocumentFetch(): boolean {
    return typeof window !== 'undefined' && window.location.protocol === 'file:' && !isDesktopApplication()
  }

  private async fetchJsonFromDocument<T>(resourcePath: string): Promise<T> {
    const url = new URL(resourcePath, window.location.href).href

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open('GET', url, true)
      request.responseType = 'text'
      request.onload = () => {
        const ok = request.status === 0 || (request.status >= 200 && request.status < 300)
        if (!ok) {
          reject(new Error(`Failed to load ${url}: HTTP ${request.status}`))
          return
        }

        try {
          resolve(JSON.parse(request.responseText) as T)
        } catch (error) {
          reject(error)
        }
      }
      request.onerror = () => reject(new Error(`Failed to load ${url}`))
      request.send()
    })
  }

  private getLocaleService(): LocaleService {
    if (!this.localeService) {
      this.localeService = new LocaleService({
        onLocaleChanged: (locale) => localizationStore.setCurrentLocale(locale),
        localesBasePath: this.webLocalesBasePath(),
        ...(this.shouldUseFileDocumentFetch() ? { fetchJson: this.fetchJsonFromDocument.bind(this) } : {}),
      })
    }

    return this.localeService
  }

  private async initializeLocalization(): Promise<void> {
    const localizationEnabled = this.featuresController.isLocalizationEnabled()
    const localeService = this.getLocaleService()

    try {
      await localeService.initialize({
        localizationEnabled,
        savedLocale: this.getSavedLocale(),
      })

      if (localizationEnabled) {
        localizationStore.setAvailableLocales(await localeService.getAvailableLocales())
      } else {
        localizationStore.setAvailableLocales({})
      }

      localizationStore.setCurrentLocale(localeService.getCurrentLocale())
      await this.syncDateFormatting(localeService.getCurrentLocale())
      this.syncNativeShellLocalization(localizationEnabled, localeService.getCurrentLocale())
    } catch (error) {
      console.error('Failed to initialize localization', error)
      localizationStore.setAvailableLocales({})
    }
  }

  private syncNativeShellLocalization(localizationEnabled: boolean, locale: string): void {
    const state = {
      localizationEnabled,
      locale: localizationEnabled ? locale : undefined,
    }

    syncDesktopMainProcessLocalization(state)
    syncMobileNativeLocalization(state)
  }

  private async syncDateFormatting(appLocale: string): Promise<void> {
    await configureDateLocale({
      appLocale,
      localizationEnabled: this.featuresController.isLocalizationEnabled(),
    })
  }
}
