import { DEFAULT_LOCALE, LocaleCatalog } from '@standardnotes/i18n'
import { action, makeObservable, observable } from 'mobx'

class LocalizationStore {
  currentLocale = DEFAULT_LOCALE
  availableLocales: LocaleCatalog = {}
  availableLocalesFailedToLoad = false

  constructor() {
    makeObservable(this, {
      currentLocale: observable,
      availableLocales: observable,
      availableLocalesFailedToLoad: observable,
      setCurrentLocale: action,
      setAvailableLocales: action,
      setAvailableLocalesFailedToLoad: action,
    })
  }

  setCurrentLocale(locale: string): void {
    this.currentLocale = locale
  }

  setAvailableLocales(catalog: LocaleCatalog): void {
    this.availableLocales = catalog
    this.availableLocalesFailedToLoad = false
  }

  setAvailableLocalesFailedToLoad(): void {
    this.availableLocales = {}
    this.availableLocalesFailedToLoad = true
  }
}

export const localizationStore = new LocalizationStore()
