import { DEFAULT_LOCALE, getBrowserLanguages, resolveLocale } from './LocaleResolver'

const availableLocales = ['en_US', 'fr_FR', 'de_DE', 'es_LA', 'tr_TR', 'zh_CN']

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

  it('returns the default locale when no locales are available', () => {
    expect(
      resolveLocale({
        availableLocales: [],
        savedLocale: 'fr_FR',
      }),
    ).toBe(DEFAULT_LOCALE)
  })

  it('uses the saved locale when one is set', () => {
    expect(
      resolveLocale({
        availableLocales,
        savedLocale: 'tr_TR',
      }),
    ).toBe('tr_TR')
  })

  it('matches by language when the saved locale region differs', () => {
    expect(
      resolveLocale({
        availableLocales,
        savedLocale: 'fr_BE',
      }),
    ).toBe('fr_FR')
  })

  it('prefers an exact saved locale match over an earlier language match', () => {
    expect(
      resolveLocale({
        availableLocales: ['fr_CA', 'fr_FR'],
        savedLocale: 'fr_FR',
      }),
    ).toBe('fr_FR')
  })

  it('falls back to browser languages when no saved locale is set', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['es-MX', 'en-US'] },
      configurable: true,
    })

    expect(
      resolveLocale({
        availableLocales,
      }),
    ).toBe('es_LA')
  })

  it('matches browser-style hyphenated locale codes', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['fr-FR'] },
      configurable: true,
    })

    expect(
      resolveLocale({
        availableLocales,
      }),
    ).toBe('fr_FR')
  })

  it('returns the default locale when no saved or browser locale matches', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['ja-JP'] },
      configurable: true,
    })

    expect(
      resolveLocale({
        availableLocales,
      }),
    ).toBe(DEFAULT_LOCALE)
  })

  it('uses explicit environment locales instead of navigator', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['en-US'] },
      configurable: true,
    })

    expect(
      resolveLocale({
        availableLocales,
        environmentLocales: ['de-DE'],
      }),
    ).toBe('de_DE')
  })
})
