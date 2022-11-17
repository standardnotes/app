export interface Persistable<T> {
  getPersistableValue(): T
  hydrateFromPersistedValue(value: T | undefined): void
}
