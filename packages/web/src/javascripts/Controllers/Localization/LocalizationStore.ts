import { DEFAULT_LOCALE } from '@standardnotes/i18n'
import { action, makeObservable, observable } from 'mobx'

class LocalizationStore {
  currentLocale = DEFAULT_LOCALE

  constructor() {
    makeObservable(this, {
      currentLocale: observable,
      setCurrentLocale: action,
    })
  }

  setCurrentLocale(locale: string): void {
    this.currentLocale = locale
  }
}

export const localizationStore = new LocalizationStore()
