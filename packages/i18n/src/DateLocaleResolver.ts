const INTL_LOCALE_OVERRIDES: Record<string, string> = {
  es_LA: 'es-419',
}

const DAYJS_LOCALE_OVERRIDES: Record<string, string> = {
  pt_BR: 'pt-br',
  zh_CN: 'zh-cn',
}

export type ResolvedDateLocales = {
  intlLocale: string | undefined
  dayjsLocale: string
}

export type ResolveActiveDateLocalesOptions = {
  appLocale: string
  localizationEnabled: boolean
  /** The user's preferred languages, in order, e.g. `navigator.languages`. */
  preferredLocales?: readonly string[]
}

export function toIntlLocale(appLocale: string): string {
  return INTL_LOCALE_OVERRIDES[appLocale] ?? appLocale.replace('_', '-')
}

/** Compares script too, so a Traditional Chinese preference doesn't format dates next to a Simplified Chinese UI. */
function toLanguageAndScript(tag: string): string | undefined {
  try {
    const { language, script } = new Intl.Locale(tag).maximize()
    return `${language}-${script}`
  } catch {
    return undefined
  }
}

/**
 * Prefers the user's own regional variant of the app language (e.g. `en-GB` for an `en_US` UI) so dates follow their
 * regional conventions, falling back to the app locale when none of their preferred languages match it.
 */
export function resolveIntlLocale(appLocale: string, preferredLocales: readonly string[] = []): string {
  const appIntlLocale = toIntlLocale(appLocale)
  const appLanguage = toLanguageAndScript(appIntlLocale)
  if (!appLanguage) {
    return appIntlLocale
  }

  return preferredLocales.find((tag) => toLanguageAndScript(tag) === appLanguage) ?? appIntlLocale
}

export function toDayjsLocale(appLocale: string): string {
  return DAYJS_LOCALE_OVERRIDES[appLocale] ?? appLocale.split(/[-_]/)[0].toLowerCase()
}

export function resolveActiveDateLocales(options: ResolveActiveDateLocalesOptions): ResolvedDateLocales {
  if (!options.localizationEnabled) {
    return {
      intlLocale: undefined,
      dayjsLocale: 'en',
    }
  }

  return {
    intlLocale: resolveIntlLocale(options.appLocale, options.preferredLocales),
    dayjsLocale: toDayjsLocale(options.appLocale),
  }
}
