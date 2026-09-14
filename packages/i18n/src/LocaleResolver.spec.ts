import {
  DEFAULT_LOCALE,
  getBrowserLanguages,
  getClosestLocaleCode,
  resolveLocale,
} from './LocaleResolver'

const availableLocales = ['en_US', 'fr_FR', 'de_DE', 'es_LA', 'tr_TR', 'zh_CN']

describe('getClosestLocaleCode', () => {
  it('returns undefined when no locales are available', () => {
    expect(getClosestLocaleCode('fr_FR', [])).toBeUndefined()
  })

  it('returns an exact match', () => {
    expect(getClosestLocaleCode('fr_FR', availableLocales)).toBe('fr_FR')
  })

  it('matches by language when region differs', () => {
    expect(getClosestLocaleCode('fr_BE', availableLocales)).toBe('fr_FR')
  })

  it('matches browser-style hyphenated locale codes', () => {
    expect(getClosestLocaleCode('fr-FR', availableLocales)).toBe('fr_FR')
  })

  it('prefers an exact match over an earlier language match', () => {
    expect(getClosestLocaleCode('fr_FR', ['fr_CA', 'fr_FR'])).toBe('fr_FR')
  })

  it('returns undefined when no language matches', () => {
    expect(getClosestLocaleCode('ja_JP', availableLocales)).toBeUndefined()
  })
})

describe('getBrowserLanguages', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    })
  })

  it('returns an empty array when navigator is unavailable', () => {
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      configurable: true,
    })

    expect(getBrowserLanguages()).toEqual([])
  })

  it('returns navigator.languages when available', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['fr-FR', 'en-US'] },
      configurable: true,
    })

    expect(getBrowserLanguages()).toEqual(['fr-FR', 'en-US'])
  })

  it('falls back to navigator.language', () => {
    Object.defineProperty(global, 'navigator', {
      value: { language: 'de-DE' },
      configurable: true,
    })

    expect(getBrowserLanguages()).toEqual(['de-DE'])
  })
})

describe('resolveLocale', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    })
  })

  it('returns the default locale when localization is disabled', () => {
    expect(
      resolveLocale({
        availableLocales,
        savedLocale: 'fr_FR',
      }),
    ).toBe(DEFAULT_LOCALE)
  })

  it('returns the default locale when localization is enabled but no locales are available', () => {
    expect(
      resolveLocale({
        availableLocales: [],
        localizationEnabled: true,
      }),
    ).toBe(DEFAULT_LOCALE)
  })

  it('uses the saved locale when localization is enabled', () => {
    expect(
      resolveLocale({
        availableLocales,
        localizationEnabled: true,
        savedLocale: 'tr_TR',
      }),
    ).toBe('tr_TR')
  })

  it('falls back to browser languages when no saved locale is set', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['es-MX', 'en-US'] },
      configurable: true,
    })

    expect(
      resolveLocale({
        availableLocales,
        localizationEnabled: true,
      }),
    ).toBe('es_LA')
  })

  it('returns the default locale when no saved or browser locale matches', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['ja-JP'] },
      configurable: true,
    })

    expect(
      resolveLocale({
        availableLocales,
        localizationEnabled: true,
      }),
    ).toBe(DEFAULT_LOCALE)
  })
})
