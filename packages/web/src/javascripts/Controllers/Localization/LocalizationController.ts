import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { resolveLocale } from '@standardnotes/i18n'
import { getWebLocaleService } from '@/Controllers/Localization/WebLocaleService'
import { configureDateLocale } from '@/Utils/DateLocale'
import { syncDesktopMainProcessLocalization } from '@/Application/Device/SyncDesktopMainProcessLocalization'
import { syncMobileNativeLocalization } from '@/Application/Device/SyncMobileNativeLocalization'
import { clearPersistedLocale, getPersistedLocale, persistLocale } from '@/Utils/LocalePersistence'
import { addToast, ToastType } from '@standardnotes/toast'
import { ElementIds } from '@/Constants/ElementIDs'
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
      labsSpotlightOpen: observable,
      dismissLabsSpotlight: action,
      openLanguageSettingsFromLabsSpotlight: action,
    })

    eventBus.addEventHandler(this, ApplicationEvent.FeaturesAvailabilityChanged)
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataLoaded)
    eventBus.addEventHandler(this, ApplicationEvent.PreferencesChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.LocalDataLoaded:
        this.labsSpotlightPrefLoaded = true
        await this.initializeLocalization()
        this.setLabsSpotlightOpen(this.shouldShowLabsSpotlight())
        break
      case ApplicationEvent.FeaturesAvailabilityChanged:
      case ApplicationEvent.PreferencesChanged:
        await this.initializeLocalization()
        this.setLabsSpotlightOpen(this.shouldShowLabsSpotlight())
        break
    }
  }

  dismissLabsSpotlight = (): void => {
    this.setLabsSpotlightOpen(false)
    void this.preferences.setValue(PrefKey.HasSeenLocalizationLabsSpotlight, true)
  }

  openLanguageSettingsFromLabsSpotlight = (): void => {
    this.dismissLabsSpotlight()
    this.preferencesController.openPreferencesAndScrollToSection(ElementIds.LanguagePreferencesSection, 'general')
  }

  private hasSeenLocalizationLabsSpotlight(): boolean {
    return this.preferences.getValue(
      PrefKey.HasSeenLocalizationLabsSpotlight,
      PrefDefaults[PrefKey.HasSeenLocalizationLabsSpotlight],
    )
  }

  private shouldShowLabsSpotlight(): boolean {
    if (!this.labsSpotlightPrefLoaded) {
      return false
    }

    const routeType = this.routeService.getRoute().type

    return (
      this.featuresController.isLocalizationFeatureAvailable() &&
      !this.featuresController.isLocalizationEnabled() &&
      !this.hasSeenLocalizationLabsSpotlight() &&
      routeType !== RouteType.Purchase &&
      routeType !== RouteType.Settings
    )
  }

  private setLabsSpotlightOpen(open: boolean): void {
    runInAction(() => {
      this.labsSpotlightOpen = open
    })
  }

  async changeLocaleAndReload(locale: string): Promise<void> {
    if (locale === localizationStore.currentLocale) {
      return
    }

    if (!this.featuresController.isLocalizationEnabled()) {
      return
    }

    let resolvedLocale: string
    try {
      resolvedLocale = await this.loadLocale(locale)
    } catch (error) {
      console.error('Failed to load locale before reload', error)
      addToast({
        type: ToastType.Error,
        message: c('B6.Preferences.General.Language.Error').t`Could not load the selected language.`,
      })
      return
    }

    persistLocale(resolvedLocale)

    try {
      await this.preferences.setValue(PrefKey.Locale, resolvedLocale)
    } catch (error) {
      console.error('Failed to sync locale preference', error)
    }

    window.location.reload()
  }

  async enableLocalization(): Promise<void> {
    try {
      persistLocale(await this.loadLocale(this.getSavedLocale()))
    } catch (error) {
      console.error('Failed to load locale before reload', error)
    }

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

  private async loadLocale(locale: string | undefined): Promise<string> {
    const localeService = getWebLocaleService()
    const catalog = await localeService.getAvailableLocales()
    const resolvedLocale = resolveLocale({
      savedLocale: locale,
      availableLocales: Object.keys(catalog),
    })

    await localeService.loadAndActivateLocale(resolvedLocale)
    return resolvedLocale
  }

  private updatePersistedLocale(localizationEnabled: boolean, locale: string): boolean {
    const persistedLocale = getPersistedLocale()

    if (!localizationEnabled) {
      if (!persistedLocale) {
        return false
      }
      clearPersistedLocale()
      return true
    }

    if (persistedLocale === locale) {
      return false
    }
    persistLocale(locale)
    return true
  }

  private async initializeLocalization(): Promise<void> {
    const localizationEnabled = this.featuresController.isLocalizationEnabled()
    const localeService = getWebLocaleService()
    const activeLocale = localeService.getCurrentLocale()

    try {
      await localeService.initialize({
        localizationEnabled,
        savedLocale: this.getSavedLocale(),
      })

      const locale = localeService.getCurrentLocale()

      if (this.updatePersistedLocale(localizationEnabled, locale) && locale !== activeLocale) {
        window.location.reload()
        return
      }

      if (localizationEnabled) {
        localizationStore.setAvailableLocales(await localeService.getAvailableLocales())
      } else {
        localizationStore.setAvailableLocales({})
      }

      await this.syncDateFormatting(locale)
      localizationStore.setCurrentLocale(locale)
      this.syncNativeShellLocalization(localizationEnabled, locale)
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
