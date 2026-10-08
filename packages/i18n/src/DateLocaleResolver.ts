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
}

export function toIntlLocale(appLocale: string): string {
  return INTL_LOCALE_OVERRIDES[appLocale] ?? appLocale.replace('_', '-')
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
    intlLocale: toIntlLocale(options.appLocale),
    dayjsLocale: toDayjsLocale(options.appLocale),
  }
}
