import { clearPersistedLocale, getPersistedLocale, persistLocale } from './LocalePersistence'

describe('LocalePersistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads and writes the persisted locale', () => {
    persistLocale('es_LA')

    expect(getPersistedLocale()).toBe('es_LA')
  })

  it('returns undefined when no locale is persisted', () => {
    expect(getPersistedLocale()).toBeUndefined()
  })

  it('clears the persisted locale', () => {
    persistLocale('fr_FR')
    clearPersistedLocale()

    expect(getPersistedLocale()).toBeUndefined()
  })
})
