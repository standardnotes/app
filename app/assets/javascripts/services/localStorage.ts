export enum StorageKey {
  DisableErrorReporting = 'DisableErrorReporting',
}

export const storage = {
  get(key: StorageKey) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  set(key: StorageKey, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: StorageKey) {
    localStorage.removeItem(key);
  },
};
