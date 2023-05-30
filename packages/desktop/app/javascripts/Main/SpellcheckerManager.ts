/* eslint-disable no-inline-comments */
import { Store } from './Store/Store'
import { StoreKeys } from './Store/StoreKeys'
import { isMac } from './Types/Platforms'
import { isDev } from './Utils/Utils'

export enum Language {
  AF = 'af',
  ID = 'id',
  CA = 'ca',
  CS = 'cs',
  CY = 'cy',
  DA = 'da',
  DE = 'de',
  SH = 'sh',
  ET = 'et',
  EN_AU = 'en-AU',
  EN_CA = 'en-CA',
  EN_GB = 'en-GB',
  EN_US = 'en-US',
  ES = 'es',
  ES_419 = 'es-419',
  ES_ES = 'es-ES',
  ES_US = 'es-US',
  ES_MX = 'es-MX',
  ES_AR = 'es-AR',
  FO = 'fo',
  FR = 'fr',
  HR = 'hr',
  IT = 'it',
  PL = 'pl',
  LV = 'lv',
  LT = 'lt',
  HU = 'hu',
  NL = 'nl',
  NB = 'nb',
  PT_BR = 'pt-BR',
  PT_PT = 'pt-PT',
  RO = 'ro',
  SQ = 'sq',
  SK = 'sk',
  SL = 'sl',
  SV = 'sv',
  VI = 'vi',
  TR = 'tr',
  EL = 'el',
  BG = 'bg',
  RU = 'ru',
  SR = 'sr',
  TG = 'tg',
  UK = 'uk',
  HY = 'hy',
  HE = 'he',
  FA = 'fa',
  HI = 'hi',
  TA = 'ta',
  KO = 'ko',
}

function isLanguage(language: any): language is Language {
  return Object.values(Language).includes(language)
}

function log(...message: any) {
  console.log('spellcheckerMaager:', ...message)
}

export interface SpellcheckerManager {
  languages(): Array<{
    code: string
    name: string
    enabled: boolean
  }>
  addLanguage(code: string): void
  removeLanguage(code: string): void
}

export function createSpellcheckerManager(
  store: Store,
  webContents: Electron.WebContents,
  userLocale: string,
): SpellcheckerManager | undefined {
  /**
   * On MacOS the system spellchecker is used and every related Electron method
   * is a no-op. Return early to prevent unnecessary code execution/allocations
   */
  if (isMac()) {
    return
  }

  const session = webContents.session

  /**
   * Mapping of language codes predominantly based on
   * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
   */
  const LanguageCodes: Readonly<Record<Language, string>> = {
    af: 'Afrikaans' /** Afrikaans */,
    id: 'Bahasa Indonesia' /** Indonesian */,
    ca: 'Català, Valencià' /** Catalan, Valencian */,
    cs: 'Čeština, Český Jazyk' /** Czech */,
    cy: 'Cymraeg' /** Welsh */,
    da: 'Dansk' /** Danish */,
    de: 'Deutsch' /** German */,
    sh: 'Deutsch, Schaffhausen' /** German, Canton of Schaffhausen */,
    et: 'Eesti, Eesti Keel' /** Estonian */,
    'en-AU': 'English, Australia',
    'en-CA': 'English, Canada',
    'en-GB': 'English, Great Britain',
    'en-US': 'English, United States',
    es: 'Español' /** Spanish, Castilian */,
    'es-419': 'Español, America Latina' /** Spanish, Latin American */,
    'es-ES': 'Español, España' /** Spanish, Spain */,
    'es-US': 'Español, Estados Unidos de América' /** Spanish, United States */,
    'es-MX': 'Español, Estados Unidos Mexicanos' /** Spanish, Mexico */,
    'es-AR': 'Español, República Argentina' /** Spanish, Argentine Republic */,
    fo: 'Føroyskt' /** Faroese */,
    fr: 'Français' /** French */,
    hr: 'Hrvatski Jezik' /** Croatian */,
    it: 'Italiano' /** Italian */,
    pl: 'Język Polski, Polszczyzna' /** Polish */,
    lv: 'Latviešu Valoda' /** Latvian */,
    lt: 'Lietuvių Kalba' /** Lithuanian */,
    hu: 'Magyar' /** Hungarian */,
    nl: 'Nederlands, Vlaams' /** Dutch, Flemish */,
    nb: 'Norsk Bokmål' /** Norwegian Bokmål */,
    'pt-BR': 'Português, Brasil' /** Portuguese, Brazil */,
    'pt-PT': 'Português, República Portuguesa' /** Portuguese, Portugal */,
    ro: 'Română' /** Romanian, Moldavian, Moldovan */,
    sq: 'Shqip' /** Albanian */,
    sk: 'Slovenčina, Slovenský Jazyk' /** Slovak */,
    sl: 'Slovenski Jezik, Slovenščina' /** Slovenian */,
    sv: 'Svenska' /** Swedish */,
    vi: 'Tiếng Việt' /** Vietnamese */,
    tr: 'Türkçe' /** Turkish */,
    el: 'ελληνικά' /** Greek */,
    bg: 'български език' /** Bulgarian */,
    ru: 'Русский' /** Russian */,
    sr: 'српски језик' /** Serbian */,
    tg: 'тоҷикӣ, toçikī, تاجیکی‎' /** Tajik */,
    uk: 'Українська' /** Ukrainian */,
    hy: 'Հայերեն' /** Armenian */,
    he: 'עברית' /** Hebrew */,
    fa: 'فارسی' /** Persian */,
    hi: 'हिन्दी, हिंदी' /** Hindi */,
    ta: 'தமிழ்' /** Tamil */,
    ko: '한국어' /** Korean */,
  }

  const availableSpellCheckerLanguages = Object.values(Language).filter((language) =>
    session.availableSpellCheckerLanguages.includes(language),
  )

  if (isDev() && availableSpellCheckerLanguages.length !== session.availableSpellCheckerLanguages.length) {
    /** This means that not every available language has been accounted for. */
    const firstOutlier = session.availableSpellCheckerLanguages.find(
      (language, index) => availableSpellCheckerLanguages[index] !== language,
    )
    console.error(`Found unsupported language code: ${firstOutlier}`)
  }

  setSpellcheckerLanguages()

  function setSpellcheckerLanguages() {
    const { session } = webContents
    let selectedCodes = store.get(StoreKeys.SelectedSpellCheckerLanguageCodes)

    if (selectedCodes === null) {
      /** First-time setup. Set a default language */
      selectedCodes = determineDefaultSpellcheckerLanguageCodes(session.availableSpellCheckerLanguages, userLocale)
      store.set(StoreKeys.SelectedSpellCheckerLanguageCodes, selectedCodes)
    }
    session.setSpellCheckerLanguages([...selectedCodes])
  }

  function determineDefaultSpellcheckerLanguageCodes(
    availableSpellCheckerLanguages: string[],
    userLocale: string,
  ): Set<Language> {
    const localeIsSupported = availableSpellCheckerLanguages.includes(userLocale)
    if (localeIsSupported && isLanguage(userLocale)) {
      return new Set([userLocale])
    } else {
      log(`Spellchecker doesn't support locale '${userLocale}'.`)
      return new Set()
    }
  }

  function selectedLanguageCodes(): Set<Language> {
    return store.get(StoreKeys.SelectedSpellCheckerLanguageCodes) || new Set()
  }

  return {
    languages() {
      const codes = selectedLanguageCodes()
      return availableSpellCheckerLanguages.map((code) => ({
        code,
        name: LanguageCodes[code],
        enabled: codes.has(code),
      }))
    },
    addLanguage(code: Language) {
      const selectedCodes = selectedLanguageCodes()
      selectedCodes.add(code)
      store.set(StoreKeys.SelectedSpellCheckerLanguageCodes, selectedCodes)
      session.setSpellCheckerLanguages(Array.from(selectedCodes))
    },
    removeLanguage(code: Language) {
      const selectedCodes = selectedLanguageCodes()
      selectedCodes.delete(code)
      store.set(StoreKeys.SelectedSpellCheckerLanguageCodes, selectedCodes)
      session.setSpellCheckerLanguages(Array.from(selectedCodes))
    },
  }
}
