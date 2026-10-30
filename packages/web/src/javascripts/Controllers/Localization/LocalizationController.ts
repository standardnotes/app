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
  hasSeenLabsSpotlight,
  markLabsSpotlightSeen,
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
} from '@standardnotes/snjs'

export class LocalizationController extends AbstractViewController implements InternalEventHandlerInterface {
  labsSpotlightOpen = false

  private initializedWithLocalizationDisabled = false
  private isTogglingLocalization = false
  private availableLocalesRequested = false

  constructor(
    private readonly featuresController: FeaturesController,
    private readonly workspaceIdentifier: string,
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
    eventBus.addEventHandler(this, ApplicationEvent.SignedOut)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.LocalDataLoaded:
      case ApplicationEvent.FeaturesAvailabilityChanged:
        await this.initializeLocalization()
        this.setLabsSpotlightOpen(this.shouldShowLabsSpotlight())
        break
      case ApplicationEvent.SignedOut:
        clearPersistedLocale(this.workspaceIdentifier)
        break
    }
  }

  dismissLabsSpotlight = (): void => {
    this.setLabsSpotlightOpen(false)
    markLabsSpotlightSeen()
  }

  openLanguageSettingsFromLabsSpotlight = (): void => {
    this.dismissLabsSpotlight()
    this.preferencesController.openPreferencesAndScrollToSection(ElementIds.LanguagePreferencesSection, 'general')
  }

  private shouldShowLabsSpotlight(): boolean {
    const routeType = this.routeService.getRoute().type

    return (
      this.featuresController.isLocalizationFeatureAvailable() &&
      !this.featuresController.isLocalizationEnabled() &&
      !hasSeenLabsSpotlight() &&
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
    if (locale === localizationStore.currentLocale && locale === getPersistedLocale(this.workspaceIdentifier)) {
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

    persistLocale(this.workspaceIdentifier, resolvedLocale)
    this.reloadAndShowToast(resolvedLocale)
    return true
  }

  /**
   * Resolves to `true` if the page is reloading, or `false` if the toggle was applied in place because the app is
   * already displayed in the target language.
   */
  async toggleLocalization(waitBeforeReload: Promise<void>): Promise<boolean> {
    this.isTogglingLocalization = true
    const activeLocale = localizationStore.currentLocale
    this.featuresController.toggleLocalization()

    if (this.featuresController.isLocalizationEnabled()) {
      try {
        await this.loadLocale(getPersistedLocale(this.workspaceIdentifier))
      } catch (error) {
        console.error('Failed to load locale before reload', error)
      }
    }

    await waitBeforeReload

    this.isTogglingLocalization = false
    return this.initializeLocalization(activeLocale)
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
    const persistedLocale = getPersistedLocale(this.workspaceIdentifier)

    if (!localizationEnabled) {
      if (!persistedLocale) {
        return false
      }
      clearPersistedLocale(this.workspaceIdentifier)
      return true
    }

    if (persistedLocale === locale) {
      return false
    }
    persistLocale(this.workspaceIdentifier, locale)
    return true
  }

  /** Loaded while localization is still off so the language dropdown can show as soon as it's turned on. */
  private async preloadAvailableLocales(): Promise<void> {
    if (this.availableLocalesRequested || !this.featuresController.isLocalizationFeatureAvailable()) {
      return
    }
    this.availableLocalesRequested = true

    try {
      const catalog = await getWebLocaleService().getAvailableLocales()
      localizationStore.setAvailableLocales(catalog)
    } catch (error) {
      this.availableLocalesRequested = false
      console.error('Failed to load locale catalog', error)
      localizationStore.setAvailableLocalesFailedToLoad()
    }
  }

  /**
   * Resolves to `true` if the page is reloading. Pass `activeLocale` when a locale was activated in memory ahead of a
   * reload, so it isn't mistaken for the one displayed.
   */
  private async initializeLocalization(activeLocale = getWebLocaleService().getCurrentLocale()): Promise<boolean> {
    if (this.isTogglingLocalization) {
      return false
    }

    void this.preloadAvailableLocales()

    const localizationEnabled = this.featuresController.isLocalizationEnabled()
    if (!localizationEnabled && this.initializedWithLocalizationDisabled) {
      return false
    }
    this.initializedWithLocalizationDisabled = !localizationEnabled

    const localeService = getWebLocaleService()

    try {
      const catalog = localizationEnabled ? await localeService.getAvailableLocales() : undefined
      const locale = catalog
        ? resolveLocale({
            savedLocale: getPersistedLocale(this.workspaceIdentifier),
            availableLocales: Object.keys(catalog),
          })
        : DEFAULT_LOCALE

      const persistedLocaleChanged = this.updatePersistedLocale(localizationEnabled, locale)
      if (locale !== activeLocale && (persistedLocaleChanged || !localizationEnabled)) {
        this.reloadAndShowToast(locale)
        return true
      }

      if (catalog) {
        localizationStore.setAvailableLocales(catalog)
      }
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
    return false
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
