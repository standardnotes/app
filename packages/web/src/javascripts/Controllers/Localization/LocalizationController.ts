import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { DEFAULT_LOCALE, LOCALES_BASE_PATH, LocaleService, resolveLocale } from '@standardnotes/i18n'
import { configureDateLocale } from '@/Utils/DateLocale'
import { syncDesktopMainProcessLocalization } from '@/Application/Device/SyncDesktopMainProcessLocalization'
import { syncMobileNativeLocalization } from '@/Application/Device/SyncMobileNativeLocalization'
import { persistLocale } from '@/Utils/LocalePersistence'
import { isDesktopApplication } from '@/Utils'
import { addToast, ToastType } from '@standardnotes/toast'
import { c } from 'ttag'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  PrefKey,
  PreferenceServiceInterface,
} from '@standardnotes/snjs'

export class LocalizationController extends AbstractViewController implements InternalEventHandlerInterface {
  private localeService?: LocaleService

  constructor(
    private readonly featuresController: FeaturesController,
    private readonly getSavedLocale: () => string | undefined,
    private readonly preferences: PreferenceServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, ApplicationEvent.FeaturesAvailabilityChanged)
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataLoaded)
    eventBus.addEventHandler(this, ApplicationEvent.PreferencesChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.FeaturesAvailabilityChanged:
      case ApplicationEvent.LocalDataLoaded:
      case ApplicationEvent.PreferencesChanged:
        await this.initializeLocalization()
        break
    }
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

  async reinitialize(): Promise<void> {
    await this.initializeLocalization()
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
    return (
      typeof window !== 'undefined' && window.location.protocol === 'file:' && !isDesktopApplication()
    )
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
        ...(this.shouldUseFileDocumentFetch()
          ? { fetchJson: this.fetchJsonFromDocument.bind(this) }
          : {}),
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
