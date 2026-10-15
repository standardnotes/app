import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { DEFAULT_LOCALE, resolveLocale } from '@standardnotes/i18n'
import { getWebLocaleService } from '@/Controllers/Localization/WebLocaleService'
import { configureDateLocale } from '@/Utils/DateLocale'
import { syncDesktopMainProcessLocalization } from '@/Application/Device/SyncDesktopMainProcessLocalization'
import { syncMobileNativeLocalization } from '@/Application/Device/SyncMobileNativeLocalization'
import {
  clearPersistedLocale,
  getPersistedLocale,
  persistLocale,
  setPendingLocaleSwitch,
  takePendingLocaleSwitch,
} from '@/Utils/LocalePersistence'
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
  private initializedWithLocalizationDisabled = false
  private isTogglingLocalization = false

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
    eventBus.addEventHandler(this, ApplicationEvent.SignedOut)
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
      case ApplicationEvent.SignedOut:
        clearPersistedLocale()
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

  async changeLocaleAndReload(locale: string): Promise<boolean> {
    if (locale === localizationStore.currentLocale && locale === getPersistedLocale()) {
      return false
    }

    if (!this.featuresController.isLocalizationEnabled()) {
      return false
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
      return false
    }

    persistLocale(resolvedLocale)

    try {
      await this.preferences.setValue(PrefKey.Locale, resolvedLocale)
    } catch (error) {
      console.error('Failed to sync locale preference', error)
    }

    this.reloadAndShowToast(resolvedLocale)
    return true
  }

  async toggleLocalization(waitBeforeReload: Promise<void>): Promise<void> {
    this.isTogglingLocalization = true
    this.featuresController.toggleLocalization()

    const locale = this.featuresController.isLocalizationEnabled()
      ? await this.enableLocalization()
      : await this.disableLocalization()

    await waitBeforeReload

    if (locale) {
      this.reloadAndShowToast(locale)
    } else {
      window.location.reload()
    }
  }

  private async enableLocalization(): Promise<string | undefined> {
    try {
      const locale = await this.loadLocale(this.getSavedLocale())
      persistLocale(locale)
      return locale
    } catch (error) {
      console.error('Failed to load locale before reload', error)
      return undefined
    }
  }

  private async disableLocalization(): Promise<string> {
    clearPersistedLocale()

    try {
      await this.preferences.setValue(PrefKey.Locale, PrefDefaults[PrefKey.Locale])
    } catch (error) {
      console.error('Failed to clear locale preference', error)
    }

    return DEFAULT_LOCALE
  }

  private reloadAndShowToast(locale: string): void {
    if (locale !== localizationStore.currentLocale) {
      setPendingLocaleSwitch(locale)
    }

    window.location.reload()
  }

  private async showLocaleSwitchedToast(locale: string): Promise<void> {
    let languageName = locale
    try {
      languageName = (await getWebLocaleService().getAvailableLocales())[locale] ?? locale
    } catch (error) {
      console.error('Failed to load locale catalog', error)
    }

    addToast({
      type: ToastType.Success,
      message: c('B6.Preferences.General.Language.Info').t`Language switched to ${languageName}`,
    })
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
    if (this.isTogglingLocalization) {
      return
    }

    const localizationEnabled = this.featuresController.isLocalizationEnabled()
    if (!localizationEnabled && this.initializedWithLocalizationDisabled) {
      return
    }
    this.initializedWithLocalizationDisabled = !localizationEnabled

    const localeService = getWebLocaleService()
    const activeLocale = localeService.getCurrentLocale()

    try {
      const catalog = localizationEnabled ? await localeService.getAvailableLocales() : {}
      const locale = localizationEnabled
        ? resolveLocale({ savedLocale: this.getSavedLocale(), availableLocales: Object.keys(catalog) })
        : DEFAULT_LOCALE

      const persistedLocaleChanged = this.updatePersistedLocale(localizationEnabled, locale)
      if (locale !== activeLocale && (persistedLocaleChanged || !localizationEnabled)) {
        this.reloadAndShowToast(locale)
        return
      }

      localizationStore.setAvailableLocales(catalog)
    } catch (error) {
      console.error('Failed to load locale catalog', error)
      localizationStore.setAvailableLocalesFailedToLoad()
    }

    if (takePendingLocaleSwitch() === activeLocale) {
      void this.showLocaleSwitchedToast(activeLocale)
    }

    await this.syncDateFormatting(activeLocale)
    localizationStore.setCurrentLocale(activeLocale)
    this.syncNativeShellLocalization(localizationEnabled, activeLocale)
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
