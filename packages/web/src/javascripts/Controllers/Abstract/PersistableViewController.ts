import { AbstractViewController } from './AbstractViewController'
import { Persistable } from './Persistable'

export abstract class PersistableViewController<T> extends AbstractViewController implements Persistable<T> {
  getPersistableValue(): T {
    throw new Error('Method not implemented.')
  }

  hydrateFromPersistedValue(_value: T): void {
    throw new Error('Method not implemented.')
  }
}
