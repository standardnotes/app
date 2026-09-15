import { addLocale, LocaleData, setDefaultLang, useLocale } from 'ttag'

import { DEFAULT_LOCALE, resolveLocale } from './LocaleResolver'

export type InitializeLocaleOptions = {
  savedLocale?: string | null
  localizationEnabled: boolean
}

export const LOCALES_BASE_PATH = '/locales'

export type LocaleCatalog = Record<string, string>

export type LocaleServiceOptions = {
  onLocaleChanged?: (locale: string) => void
}

export class LocaleService {
  private currentLocale = DEFAULT_LOCALE
  private catalog?: LocaleCatalog
  private localizationEnabled = false
  private readonly loadedLocales = new Set<string>()
  private readonly onLocaleChanged?: (locale: string) => void

  constructor(options: LocaleServiceOptions = {}) {
    this.onLocaleChanged = options.onLocaleChanged
    setDefaultLang(DEFAULT_LOCALE)
  }

  getCurrentLocale(): string {
    return this.currentLocale
  }

  async getAvailableLocales(): Promise<LocaleCatalog> {
    if (this.catalog) {
      return this.catalog
    }

    this.catalog = await this.fetchJson<LocaleCatalog>(`${LOCALES_BASE_PATH}/config/locales.json`)
    return this.catalog
  }

  async initialize(options: InitializeLocaleOptions): Promise<void> {
    this.localizationEnabled = options.localizationEnabled

    if (!this.localizationEnabled) {
      await this.applyLocale(DEFAULT_LOCALE)
      return
    }

    await this.getAvailableLocales()

    const locale = resolveLocale({
      savedLocale: options.savedLocale,
      availableLocales: Object.keys(this.catalog!),
    })

    await this.applyLocale(locale)
  }

  async setLocale(locale: string): Promise<void> {
    if (!this.localizationEnabled) {
      await this.applyLocale(DEFAULT_LOCALE)
      return
    }

    await this.applyLocale(locale)
  }

  private async applyLocale(locale: string): Promise<void> {
    if (locale !== DEFAULT_LOCALE && !this.loadedLocales.has(locale)) {
      try {
        const data = await this.fetchJson<LocaleData>(`${LOCALES_BASE_PATH}/${locale}.json`)
        addLocale(locale, data)
        this.loadedLocales.add(locale)
      } catch {
        this.activateLocale(DEFAULT_LOCALE)
        return
      }
    }

    this.activateLocale(locale)
  }

  private activateLocale(locale: string): void {
    useLocale(locale)
    this.currentLocale = locale
    this.onLocaleChanged?.(locale)
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }

    return response.json() as Promise<T>
  }
}
