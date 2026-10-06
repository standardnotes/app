import { addLocale, setDefaultLang, useLocale } from 'ttag'

import { DEFAULT_LOCALE } from './LocaleResolver'
import { LocaleService } from './LocaleService'

jest.mock('ttag', () => ({
  addLocale: jest.fn(),
  setDefaultLang: jest.fn(),
  useLocale: jest.fn(),
}))

const catalog = {
  en_US: 'English',
  fr_FR: 'Français',
  tr_TR: 'Türkçe',
}

const frenchLocaleData = {
  headers: { language: 'fr_FR' },
  contexts: {
    'B2.SharedUI.Label': {
      Save: ['Enregistrer'],
    },
  },
}

function createFetchMock(handlers: Record<string, unknown>): jest.Mock {
  return jest.fn(async (input: string | URL | Request) => {
    const url = String(input)
    const payload = handlers[url]

    if (payload === undefined) {
      return {
        ok: false,
        status: 404,
      } as Response
    }

    return {
      ok: true,
      json: async () => payload,
    } as Response
  })
}

describe('LocaleService', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('loads the locale catalog', async () => {
    global.fetch = createFetchMock({
      '/locales/config/locales.json': catalog,
    })

    const service = new LocaleService()

    await expect(service.getAvailableLocales()).resolves.toEqual(catalog)
    expect(Object.keys(await service.getAvailableLocales())).toEqual(['en_US', 'fr_FR', 'tr_TR'])
  })

  it('reuses a cached locale catalog', async () => {
    const fetchMock = createFetchMock({
      '/locales/config/locales.json': catalog,
    })
    global.fetch = fetchMock

    const service = new LocaleService()

    await service.getAvailableLocales()
    await service.getAvailableLocales()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('loads translations and activates a locale', async () => {
    const onLocaleChanged = jest.fn()
    global.fetch = createFetchMock({
      '/locales/config/locales.json': catalog,
      '/locales/fr_FR.json': frenchLocaleData,
    })

    const service = new LocaleService({ onLocaleChanged })

    await service.initialize({ savedLocale: 'fr_FR', localizationEnabled: true })

    expect(addLocale).toHaveBeenCalledWith('fr_FR', frenchLocaleData)
    expect(setDefaultLang).toHaveBeenCalledWith(DEFAULT_LOCALE)
    expect(useLocale).toHaveBeenCalledWith('fr_FR')
    expect(service.getCurrentLocale()).toBe('fr_FR')
    expect(onLocaleChanged).toHaveBeenCalledWith('fr_FR')
  })

  it('does not refetch locale data that has already been loaded', async () => {
    const fetchMock = createFetchMock({
      '/locales/config/locales.json': catalog,
      '/locales/fr_FR.json': frenchLocaleData,
    })
    global.fetch = fetchMock

    const service = new LocaleService()

    await service.initialize({ savedLocale: 'fr_FR', localizationEnabled: true })
    await service.initialize({ savedLocale: 'fr_FR', localizationEnabled: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(addLocale).toHaveBeenCalledTimes(1)
  })

  it('activates the default locale without fetching translation data', async () => {
    global.fetch = createFetchMock({
      '/locales/config/locales.json': catalog,
    })

    const service = new LocaleService()

    await service.initialize({ savedLocale: DEFAULT_LOCALE, localizationEnabled: true })

    expect(addLocale).not.toHaveBeenCalled()
    expect(useLocale).toHaveBeenCalledWith(DEFAULT_LOCALE)
    expect(service.getCurrentLocale()).toBe(DEFAULT_LOCALE)
  })

  it('falls back to the default locale when translation data cannot be loaded', async () => {
    global.fetch = createFetchMock({
      '/locales/config/locales.json': catalog,
    })

    const service = new LocaleService()

    await service.initialize({ savedLocale: 'tr_TR', localizationEnabled: true })

    expect(addLocale).not.toHaveBeenCalled()
    expect(useLocale).toHaveBeenCalledWith(DEFAULT_LOCALE)
    expect(service.getCurrentLocale()).toBe(DEFAULT_LOCALE)
  })

  it('matches the closest available locale during initialize', async () => {
    global.fetch = createFetchMock({
      '/locales/config/locales.json': catalog,
      '/locales/fr_FR.json': frenchLocaleData,
    })

    const service = new LocaleService()

    await service.initialize({ savedLocale: 'fr-BE', localizationEnabled: true })

    expect(addLocale).toHaveBeenCalledWith('fr_FR', frenchLocaleData)
    expect(service.getCurrentLocale()).toBe('fr_FR')
  })

  it('forces the default locale when localization is disabled at boot', async () => {
    global.fetch = createFetchMock({
      '/locales/config/locales.json': catalog,
      '/locales/fr_FR.json': frenchLocaleData,
    })

    const service = new LocaleService()

    await service.initialize({ savedLocale: 'fr_FR', localizationEnabled: false })

    expect(addLocale).not.toHaveBeenCalled()
    expect(useLocale).toHaveBeenCalledWith(DEFAULT_LOCALE)
    expect(service.getCurrentLocale()).toBe(DEFAULT_LOCALE)
  })

  it('activates a locale loaded directly', async () => {
    global.fetch = createFetchMock({
      '/locales/fr_FR.json': frenchLocaleData,
    })

    const service = new LocaleService()

    await service.loadAndActivateLocale('fr_FR')

    expect(addLocale).toHaveBeenCalledWith('fr_FR', frenchLocaleData)
    expect(useLocale).toHaveBeenCalledWith('fr_FR')
    expect(service.getCurrentLocale()).toBe('fr_FR')
  })

  it('throws without changing the locale when a directly loaded pack is missing', async () => {
    global.fetch = createFetchMock({})

    const service = new LocaleService()

    await expect(service.loadAndActivateLocale('fr_FR')).rejects.toThrow()
    expect(useLocale).not.toHaveBeenCalled()
    expect(service.getCurrentLocale()).toBe(DEFAULT_LOCALE)
  })
})
