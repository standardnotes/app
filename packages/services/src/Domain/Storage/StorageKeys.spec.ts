import { namespacedKey } from './StorageKeys'

describe('StorageKeys', () => {
  it('namespacedKey', () => {
    expect(namespacedKey('namespace', 'key')).toEqual('namespace-key')
  })
})
