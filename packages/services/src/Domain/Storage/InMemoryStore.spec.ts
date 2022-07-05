import { InMemoryStore } from './InMemoryStore'
import { StorageKey } from './StorageKeys'

describe('InMemoryStore', () => {
  const createStore = () => new InMemoryStore()

  it('should set and retrieve a value', () => {
    const store = createStore()

    store.setValue(StorageKey.CodeVerifier, 'test')

    expect(store.getValue(StorageKey.CodeVerifier)).toEqual('test')
  })

  it('should remove a value', () => {
    const store = createStore()

    store.setValue(StorageKey.CodeVerifier, 'test')

    store.removeValue(StorageKey.CodeVerifier)

    expect(store.getValue(StorageKey.CodeVerifier)).toBeUndefined()
  })
})
