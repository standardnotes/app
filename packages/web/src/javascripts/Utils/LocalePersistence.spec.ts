import { clearPersistedLocale, getPersistedLocale, persistLocale } from './LocalePersistence'

describe('LocalePersistence', () => {
  const workspaceIdentifier = 'workspace-1'

  beforeEach(() => {
    localStorage.clear()
  })

  it('reads and writes the persisted locale', () => {
    persistLocale(workspaceIdentifier, 'es_LA')

    expect(getPersistedLocale(workspaceIdentifier)).toBe('es_LA')
  })

  it('returns undefined when no locale is persisted', () => {
    expect(getPersistedLocale(workspaceIdentifier)).toBeUndefined()
  })

  it('clears the persisted locale', () => {
    persistLocale(workspaceIdentifier, 'fr_FR')
    clearPersistedLocale(workspaceIdentifier)

    expect(getPersistedLocale(workspaceIdentifier)).toBeUndefined()
  })
})
