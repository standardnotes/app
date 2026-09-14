export const DEFAULT_LOCALE = 'en_US'

export type ResolveLocaleOptions = {
  availableLocales: readonly string[]
  localizationEnabled?: boolean
  savedLocale?: string | null
}

/**
 * Finds the closest available locale for a requested code.
 * fr_BE matches fr_FR when no exact match exists, by comparing language only.
 */
export function getClosestLocaleCode(requestedLocale: string, availableLocales: readonly string[]): string | undefined {
  if (availableLocales.length === 0) {
    return undefined
  }

  const matchingLocale = availableLocales.find((locale) => locale === requestedLocale)

  if (matchingLocale) {
    return matchingLocale
  }

  const [requestedLanguage] = requestedLocale.trim().split(/[-_]/, 2)
  const requestedLanguageCode = requestedLanguage.toLowerCase()

  return availableLocales.find((locale) => {
    const [language] = locale.trim().split(/[-_]/, 2)
    return language.toLowerCase() === requestedLanguageCode
  })
}

export function getBrowserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') {
    return []
  }

  if (navigator.languages && navigator.languages.length > 0) {
    return navigator.languages
  }

  if (navigator.language) {
    return [navigator.language]
  }

  return []
}

/**
 * Resolves the active locale. When `localizationEnabled` is false (the default),
 * returns `en_US` immediately. Otherwise:
 * 1. Saved user preference
 * 2. Browser languages
 * 3. Default locale (en_US)
 */
export function resolveLocale(options: ResolveLocaleOptions): string {
  const { savedLocale, availableLocales, localizationEnabled = false } = options

  if (!localizationEnabled || availableLocales.length === 0) {
    return DEFAULT_LOCALE
  }

  if (savedLocale) {
    const savedMatch = getClosestLocaleCode(savedLocale, availableLocales)
    if (savedMatch) {
      return savedMatch
    }
  }

  const browserLanguages = getBrowserLanguages()
  for (const browserLanguage of browserLanguages) {
    const browserMatch = getClosestLocaleCode(browserLanguage, availableLocales)
    if (browserMatch) {
      return browserMatch
    }
  }

  return DEFAULT_LOCALE
}
