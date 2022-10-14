import { AbstractService, ApplicationInterface, InternalEventBusInterface } from '@standardnotes/services'
import { PersistedState, PersistedStateKey } from './types'

const StatePersistenceKey = 'PersistedState'

export class StatePersistenceService extends AbstractService {
  constructor(
    protected application: ApplicationInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  persistValues(values: unknown) {
    const existingValues = this.getPersistedValues() ?? {}
    if (typeof existingValues !== 'object') {
      throw new Error('Persisted state malformed')
    }
    if (typeof values !== 'object') {
      throw new Error('Provided value should be an object')
    }
    this.application.setValue(StatePersistenceKey, {
      ...existingValues,
      ...values,
    })
  }

  getPersistedValues(key?: PersistedStateKey) {
    const values = this.application.getValue(StatePersistenceKey) as PersistedState

    if (!key) {
      return values
    }

    if (!values[key]) {
      return undefined
    }

    return values[key]
  }
}
