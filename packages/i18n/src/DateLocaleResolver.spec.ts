import { resolveActiveDateLocales, toDayjsLocale, toIntlLocale } from './DateLocaleResolver'

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

describe('resolveActiveDateLocales', () => {
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

  it('uses the runtime default intl locale and English dayjs when localization is disabled', () => {
    expect(
      resolveActiveDateLocales({
        appLocale: 'fr_FR',
        localizationEnabled: false,
      }),
    ).toEqual({
      intlLocale: undefined,
      dayjsLocale: 'en',
    })
  })
})
