export enum StorageKey {
  DisableErrorReporting = 'DisableErrorReporting',
  AnonymousUserId = 'AnonymousUserId',
  ShowBetaWarning = 'ShowBetaWarning',
  ShowNoAccountWarning = 'ShowNoAccountWarning',
}

export type StorageValue = {
  [StorageKey.DisableErrorReporting]: boolean;
  [StorageKey.AnonymousUserId]: string;
  [StorageKey.ShowBetaWarning]: boolean;
  [StorageKey.ShowNoAccountWarning]: boolean;
}

export const storage = {
  get<K extends StorageKey>(key: K): StorageValue[K] | null {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  set<K extends StorageKey>(key: K, value: StorageValue[K]): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: StorageKey): void {
    localStorage.removeItem(key);
  },
};
