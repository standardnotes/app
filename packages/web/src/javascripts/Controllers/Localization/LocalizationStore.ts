import { DEFAULT_LOCALE, LocaleCatalog } from '@standardnotes/i18n'
import { action, makeObservable, observable } from 'mobx'

class LocalizationStore {
  currentLocale = DEFAULT_LOCALE
  availableLocales: LocaleCatalog = {}

  constructor() {
    makeObservable(this, {
      currentLocale: observable,
      availableLocales: observable,
      setCurrentLocale: action,
      setAvailableLocales: action,
    })
  }

  setCurrentLocale(locale: string): void {
    this.currentLocale = locale
  }

  setAvailableLocales(catalog: LocaleCatalog): void {
    this.availableLocales = catalog
  }
}

export const localizationStore = new LocalizationStore()
