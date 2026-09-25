import { getLocaleCookie, LOCALE_COOKIE_NAME, setLocaleCookie } from './LocalePersistence'

describe('LocalePersistence', () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`
  })

  it('reads and writes the locale cookie', () => {
    setLocaleCookie('es_LA')

    expect(getLocaleCookie()).toBe('es_LA')
  })

  it('returns undefined when the cookie is missing', () => {
    expect(getLocaleCookie()).toBeUndefined()
  })
})
