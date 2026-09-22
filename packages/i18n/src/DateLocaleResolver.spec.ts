import {
  getBrowserIntlLocale,
  resolveActiveDateLocales,
  toDayjsLocale,
  toIntlLocale,
} from './DateLocaleResolver'

describe('toIntlLocale', () => {
  it('maps known app locales to BCP 47 tags', () => {
    expect(toIntlLocale('en_US')).toBe('en-US')
    expect(toIntlLocale('pt_BR')).toBe('pt-BR')
    expect(toIntlLocale('es_LA')).toBe('es-419')
    expect(toIntlLocale('zh_CN')).toBe('zh-CN')
  })

  it('falls back to underscore replacement for unknown locales', () => {
    expect(toIntlLocale('nl_NL')).toBe('nl-NL')
  })
})

describe('toDayjsLocale', () => {
  it('maps known app locales to dayjs locale keys', () => {
    expect(toDayjsLocale('en_US')).toBe('en')
    expect(toDayjsLocale('pt_BR')).toBe('pt-br')
    expect(toDayjsLocale('zh_CN')).toBe('zh-cn')
    expect(toDayjsLocale('es_LA')).toBe('es')
  })

  it('falls back to the language subtag for unknown locales', () => {
    expect(toDayjsLocale('nl_NL')).toBe('nl')
  })
})

describe('getBrowserIntlLocale', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    })
  })

  it('uses the first browser language when available', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['fr-FR', 'en-US'] },
      configurable: true,
    })

    expect(getBrowserIntlLocale()).toBe('fr-FR')
  })

  it('falls back to en-US when navigator is unavailable', () => {
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      configurable: true,
    })

    expect(getBrowserIntlLocale()).toBe('en-US')
  })
})

describe('resolveActiveDateLocales', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    })
  })

  it('uses app locale mappings when localization is enabled', () => {
    expect(
      resolveActiveDateLocales({
        appLocale: 'fr_FR',
        localizationEnabled: true,
      }),
    ).toEqual({
      intlLocale: 'fr-FR',
      dayjsLocale: 'fr',
    })
  })

  it('uses the browser intl locale and English dayjs when localization is disabled', () => {
    Object.defineProperty(global, 'navigator', {
      value: { languages: ['de-DE'] },
      configurable: true,
    })

    expect(
      resolveActiveDateLocales({
        appLocale: 'fr_FR',
        localizationEnabled: false,
      }),
    ).toEqual({
      intlLocale: 'de-DE',
      dayjsLocale: 'en',
    })
  })
})
