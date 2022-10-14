export interface Persistable<PersistableState> {
  getPersistableState(): PersistableState
  hydrateFromStorage(state: PersistableState): void
}
