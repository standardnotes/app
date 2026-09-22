import { getBrowserLanguages } from './LocaleResolver'

const INTL_LOCALE_BY_APP_LOCALE: Record<string, string> = {
  en_US: 'en-US',
  fr_FR: 'fr-FR',
  de_DE: 'de-DE',
  ja_JP: 'ja-JP',
  pt_BR: 'pt-BR',
  es_LA: 'es-419',
  zh_CN: 'zh-CN',
  tr_TR: 'tr-TR',
}

const DAYJS_LOCALE_BY_APP_LOCALE: Record<string, string> = {
  en_US: 'en',
  fr_FR: 'fr',
  de_DE: 'de',
  ja_JP: 'ja',
  pt_BR: 'pt-br',
  es_LA: 'es',
  zh_CN: 'zh-cn',
  tr_TR: 'tr',
}

export type ResolvedDateLocales = {
  intlLocale: string
  dayjsLocale: string
}

export type ResolveActiveDateLocalesOptions = {
  appLocale: string
  localizationEnabled: boolean
}

export function toIntlLocale(appLocale: string): string {
  return INTL_LOCALE_BY_APP_LOCALE[appLocale] ?? appLocale.replace('_', '-')
}

export function toDayjsLocale(appLocale: string): string {
  return DAYJS_LOCALE_BY_APP_LOCALE[appLocale] ?? appLocale.split(/[-_]/)[0].toLowerCase()
}

export function getBrowserIntlLocale(): string {
  const browserLanguages = getBrowserLanguages()
  if (browserLanguages.length > 0) {
    return browserLanguages[0]
  }

  return 'en-US'
}

export function resolveActiveDateLocales(options: ResolveActiveDateLocalesOptions): ResolvedDateLocales {
  if (!options.localizationEnabled) {
    return {
      intlLocale: getBrowserIntlLocale(),
      dayjsLocale: 'en',
    }
  }

  return {
    intlLocale: toIntlLocale(options.appLocale),
    dayjsLocale: toDayjsLocale(options.appLocale),
  }
}
