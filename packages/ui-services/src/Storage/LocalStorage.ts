import { PersistedStateValue } from '../StatePersistence/StatePersistence'

export enum StorageKey {
  AnonymousUserId = 'AnonymousUserId',
  ShowBetaWarning = 'ShowBetaWarning',
  ShowNoAccountWarning = 'ShowNoAccountWarning',
  FilesNavigationEnabled = 'FilesNavigationEnabled',
  MasterStatePersistenceKey = 'master-persistence-key',
}

export type StorageValue = {
  [StorageKey.AnonymousUserId]: string
  [StorageKey.ShowBetaWarning]: boolean
  [StorageKey.ShowNoAccountWarning]: boolean
  [StorageKey.FilesNavigationEnabled]: boolean
  [StorageKey.MasterStatePersistenceKey]: PersistedStateValue
}

export const storage = {
  get<K extends StorageKey>(key: K): StorageValue[K] | null {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  },
  set<K extends StorageKey>(key: K, value: StorageValue[K]): void {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove(key: StorageKey): void {
    localStorage.removeItem(key)
  },
}
