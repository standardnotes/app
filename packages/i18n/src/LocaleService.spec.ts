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
      '/locales/fr_FR.json': frenchLocaleData,
    })

    const service = new LocaleService({ onLocaleChanged })

    await service.loadAndActivateLocale('fr_FR')

    expect(addLocale).toHaveBeenCalledWith('fr_FR', frenchLocaleData)
    expect(setDefaultLang).toHaveBeenCalledWith(DEFAULT_LOCALE)
    expect(useLocale).toHaveBeenCalledWith('fr_FR')
    expect(service.getCurrentLocale()).toBe('fr_FR')
    expect(onLocaleChanged).toHaveBeenCalledWith('fr_FR')
  })

  it('rejects and keeps the current locale when the request times out', async () => {
    jest.useFakeTimers()
    global.fetch = jest.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )

    const service = new LocaleService()
    const loading = service.loadAndActivateLocale('fr_FR')
    jest.advanceTimersByTime(5000)

    await expect(loading).rejects.toThrow('aborted')
    expect(useLocale).not.toHaveBeenCalled()
    expect(service.getCurrentLocale()).toBe(DEFAULT_LOCALE)

    jest.useRealTimers()
  })

  it('does not refetch locale data that has already been loaded', async () => {
    const fetchMock = createFetchMock({
      '/locales/fr_FR.json': frenchLocaleData,
    })
    global.fetch = fetchMock

    const service = new LocaleService()

    await service.loadAndActivateLocale('fr_FR')
    await service.loadAndActivateLocale('fr_FR')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(addLocale).toHaveBeenCalledTimes(1)
  })

  it('activates the default locale without fetching translation data', async () => {
    const fetchMock = createFetchMock({})
    global.fetch = fetchMock

    const service = new LocaleService()

    await service.loadAndActivateLocale(DEFAULT_LOCALE)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(useLocale).toHaveBeenCalledWith(DEFAULT_LOCALE)
    expect(service.getCurrentLocale()).toBe(DEFAULT_LOCALE)
  })

  it('throws without changing the locale when a directly loaded pack is missing', async () => {
    global.fetch = createFetchMock({})

    const service = new LocaleService()

    await expect(service.loadAndActivateLocale('fr_FR')).rejects.toThrow()
    expect(useLocale).not.toHaveBeenCalled()
    expect(service.getCurrentLocale()).toBe(DEFAULT_LOCALE)
  })
})
