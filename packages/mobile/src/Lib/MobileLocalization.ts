import { Platform } from 'react-native'
import { MainBundlePath, readFile, readFileAssets } from 'react-native-fs'
import { addLocale, LocaleData, setDefaultLang, useLocale as setTtagLocale } from 'ttag'

export type MobileLocalizationState = {
  localizationEnabled: boolean
  /** Resolved locale from the WebView (e.g. fr_FR). Ignored when localization is off. */
  locale?: string | null
}

const DEFAULT_LOCALE = 'en_US'

const loadedLocales = new Set<string>()

setDefaultLang(DEFAULT_LOCALE)

async function readMobileLocalePack(locale: string): Promise<LocaleData> {
  const relativePath = `Web.bundle/locales/${locale}.json`
  const contents =
    Platform.OS === 'android'
      ? await readFileAssets(relativePath, 'utf8')
      : await readFile(`${MainBundlePath}/${relativePath}`, 'utf8')

  return JSON.parse(contents) as LocaleData
}

export async function applyMobileLocalization(state: MobileLocalizationState): Promise<void> {
  const locale = state.localizationEnabled && state.locale ? state.locale : DEFAULT_LOCALE

  if (locale !== DEFAULT_LOCALE && !loadedLocales.has(locale)) {
    try {
      addLocale(locale, await readMobileLocalePack(locale))
      loadedLocales.add(locale)
    } catch (error) {
      console.warn(`No mobile locale pack for ${locale}, using ${DEFAULT_LOCALE}`, error)
      setTtagLocale(DEFAULT_LOCALE)
      return
    }
  }

  setTtagLocale(locale)
}
