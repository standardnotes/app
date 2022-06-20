import { useCallback, useState } from 'react'

export enum StorageKey {
  AnonymousUserId = 'AnonymousUserId',
  ShowBetaWarning = 'ShowBetaWarning',
  ShowNoAccountWarning = 'ShowNoAccountWarning',
  FilesNavigationEnabled = 'FilesNavigationEnabled',
}

export type StorageValue = {
  [StorageKey.AnonymousUserId]: string
  [StorageKey.ShowBetaWarning]: boolean
  [StorageKey.ShowNoAccountWarning]: boolean
  [StorageKey.FilesNavigationEnabled]: boolean
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

type LocalStorageHookReturnType<Key extends StorageKey> = [StorageValue[Key] | null, (value: StorageValue[Key]) => void]

export const useLocalStorageItem = <Key extends StorageKey>(key: Key): LocalStorageHookReturnType<Key> => {
  const [value, setValue] = useState(() => storage.get(key))

  const set = useCallback(
    (value: StorageValue[Key]) => {
      storage.set(key, value)
      setValue(value)
    },
    [key],
  )

  return [value, set]
}
