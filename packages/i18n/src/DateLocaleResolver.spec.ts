import { resolveActiveDateLocales, resolveIntlLocale, toDayjsLocale, toIntlLocale } from './DateLocaleResolver'

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

describe('resolveIntlLocale', () => {
  it('uses a preferred language that matches the app language regardless of region', () => {
    expect(resolveIntlLocale('en_US', ['en-GB'])).toBe('en-GB')
    expect(resolveIntlLocale('es_LA', ['es-AR'])).toBe('es-AR')
    expect(resolveIntlLocale('pt_BR', ['pt-PT'])).toBe('pt-PT')
    expect(resolveIntlLocale('en_US', ['en'])).toBe('en')
  })

  it('uses the first matching preferred language', () => {
    expect(resolveIntlLocale('en_US', ['fr-FR', 'en-AU', 'en-GB'])).toBe('en-AU')
  })

  it('falls back to the app locale when no preferred language matches', () => {
    expect(resolveIntlLocale('en_US', ['fr-FR', 'de-DE'])).toBe('en-US')
    expect(resolveIntlLocale('es_LA', [])).toBe('es-419')
    expect(resolveIntlLocale('fr_FR')).toBe('fr-FR')
  })

  it('does not match a preferred language written in a different script', () => {
    expect(resolveIntlLocale('zh_CN', ['zh-TW', 'zh-HK'])).toBe('zh-CN')
    expect(resolveIntlLocale('zh_CN', ['zh-TW', 'zh-SG'])).toBe('zh-SG')
  })

  it('ignores invalid preferred language tags', () => {
    expect(resolveIntlLocale('en_US', ['not a locale', 'en-GB'])).toBe('en-GB')
  })
})

describe('resolveActiveDateLocales', () => {
  it('uses the preferred regional variant for intl and the app locale for dayjs', () => {
    expect(
      resolveActiveDateLocales({
        appLocale: 'en_US',
        localizationEnabled: true,
        preferredLocales: ['en-GB'],
      }),
    ).toEqual({
      intlLocale: 'en-GB',
      dayjsLocale: 'en',
    })
  })

  it('ignores preferred languages when localization is disabled', () => {
    expect(
      resolveActiveDateLocales({
        appLocale: 'en_US',
        localizationEnabled: false,
        preferredLocales: ['en-GB'],
      }),
    ).toEqual({
      intlLocale: undefined,
      dayjsLocale: 'en',
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
