import { ApplicationService, isNullOrUndefined, PrefKey, removeFromArray } from '@standardnotes/snjs'
import { MobileApplication } from './Application'

type Preferences = Record<PrefKey, any>
type PreferencesObserver = () => Promise<void> | void
export const LAST_EXPORT_DATE_KEY = 'LastExportDateKey'
const PREFS_KEY = 'preferences'

export class PreferencesManager extends ApplicationService {
  private userPreferences!: Preferences
  observers: PreferencesObserver[] = []

  /** @override */
  override async onAppLaunch() {
    void super.onAppLaunch()
    void this.loadPreferences()
  }

  override deinit() {
    this.observers = []
  }

  /**
   * Registers an observer for preferences loaded event
   * @returns function that unregisters this observer
   */
  public addPreferencesLoadedObserver(callback: PreferencesObserver) {
    this.observers.push(callback)
    return () => {
      removeFromArray(this.observers, callback)
    }
  }

  notifyObserversOfPreferencesLoaded() {
    for (const observer of this.observers) {
      void observer()
    }
  }

  get mobileApplication() {
    return this.application as MobileApplication
  }

  private async loadPreferences() {
    const preferences = await this.application.getValue(PREFS_KEY)
    this.userPreferences = (preferences as Preferences) ?? {}
    this.notifyObserversOfPreferencesLoaded()
  }

  private async saveSingleton() {
    return this.application.setValue(PREFS_KEY, this.userPreferences)
  }

  private async savePreference(key: PrefKey, value: any) {
    return this.application.setPreference(key, value)
  }

  getValue(key: PrefKey, defaultValue?: any) {
    if (!this.userPreferences) {
      return defaultValue
    }
    const value = this.application.getPreference(key)
    return !isNullOrUndefined(value) ? value : defaultValue
  }

  async setUserPrefValue(key: PrefKey, value: any) {
    this.userPreferences[key] = value
    await this.saveSingleton()
    await this.savePreference(key, value)
  }
}
