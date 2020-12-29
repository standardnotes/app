export enum StorageKey {
  DisableErrorReporting = 'DisableErrorReporting',
}

export type StorageValue = {
  [StorageKey.DisableErrorReporting]: boolean;
}

export const storage = {
  get<K extends StorageKey>(key: K): StorageValue[K] | null {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  set<K extends StorageKey>(key: K, value: StorageValue[K]) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: StorageKey) {
    localStorage.removeItem(key);
  },
};
