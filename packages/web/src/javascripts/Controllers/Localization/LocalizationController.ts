import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { DEFAULT_LOCALE, LOCALES_BASE_PATH, LocaleService, resolveLocale } from '@standardnotes/i18n'
import { configureDateLocale } from '@/Utils/DateLocale'
import { syncDesktopMainProcessLocalization } from '@/Application/Device/SyncDesktopMainProcessLocalization'
import { persistLocale } from '@/Utils/LocalePersistence'
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

  private getLocaleService(): LocaleService {
    if (!this.localeService) {
      this.localeService = new LocaleService({
        onLocaleChanged: (locale) => localizationStore.setCurrentLocale(locale),
        localesBasePath:
          typeof window !== 'undefined' && window.location.protocol === 'file:' ? 'web/locales' : LOCALES_BASE_PATH,
      })
    }

    return this.localeService
  }

  private async initializeLocalization(): Promise<void> {
    const localizationEnabled = this.featuresController.isLocalizationEnabled()
    const localeService = this.getLocaleService()

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
    this.syncDesktopMainProcess(localizationEnabled, localeService.getCurrentLocale())
  }

  private syncDesktopMainProcess(localizationEnabled: boolean, locale: string): void {
    syncDesktopMainProcessLocalization({
      localizationEnabled,
      locale: localizationEnabled ? locale : undefined,
    })
  }

  private async syncDateFormatting(appLocale: string): Promise<void> {
    await configureDateLocale({
      appLocale,
      localizationEnabled: this.featuresController.isLocalizationEnabled(),
    })
  }
}
