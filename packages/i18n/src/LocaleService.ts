import { addLocale, LocaleData, setDefaultLang, useLocale } from 'ttag'

import { DEFAULT_LOCALE } from './LocaleResolver'

export const LOCALES_BASE_PATH = '/locales'

const LOCALE_FETCH_TIMEOUT_MS = 5000

export type LocaleCatalog = Record<string, string>

export type LocaleServiceOptions = {
  onLocaleChanged?: (locale: string) => void
  loadJson?: <T>(url: string) => Promise<T>
  localesBasePath?: string
}

export class LocaleService {
  private currentLocale = DEFAULT_LOCALE
  private catalog?: Promise<LocaleCatalog>
  private readonly loadedLocales = new Set<string>()
  private readonly onLocaleChanged?: (locale: string) => void
  private readonly loadJson: <T>(url: string) => Promise<T>
  private readonly localesBasePath: string

  constructor(options: LocaleServiceOptions = {}) {
    this.onLocaleChanged = options.onLocaleChanged
    this.loadJson = options.loadJson ?? this.fetchJsonWithHttp.bind(this)
    this.localesBasePath = options.localesBasePath ?? LOCALES_BASE_PATH
    setDefaultLang(DEFAULT_LOCALE)
  }

  private localeResourcePath(relativePath: string): string {
    const base = this.localesBasePath.replace(/\/$/, '')
    return `${base}/${relativePath}`
  }

  getCurrentLocale(): string {
    return this.currentLocale
  }

  getAvailableLocales(): Promise<LocaleCatalog> {
    if (!this.catalog) {
      this.catalog = this.loadJson<LocaleCatalog>(this.localeResourcePath('config/locales.json'))
      this.catalog.catch(() => {
        this.catalog = undefined
      })
    }

    return this.catalog
  }

  /** Loads locale JSON if needed and activates it. Throws when the pack cannot be loaded. */
  async loadAndActivateLocale(locale: string): Promise<void> {
    if (locale !== DEFAULT_LOCALE && !this.loadedLocales.has(locale)) {
      const data = await this.loadJson<LocaleData>(this.localeResourcePath(`${locale}.json`))
      addLocale(locale, data)
      this.loadedLocales.add(locale)
    }

    this.activateLocale(locale)
  }

  private activateLocale(locale: string): void {
    useLocale(locale)
    this.currentLocale = locale
    this.onLocaleChanged?.(locale)
  }

  private async fetchJsonWithHttp<T>(url: string): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LOCALE_FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(url, { signal: controller.signal })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`)
      }

      return (await response.json()) as T
    } finally {
      clearTimeout(timeout)
    }
  }
}
