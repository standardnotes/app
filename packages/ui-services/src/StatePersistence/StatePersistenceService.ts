import { AbstractService, ApplicationInterface, InternalEventBusInterface } from '@standardnotes/services'

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

  getPersistedValues() {
    const values = this.application.getValue(StatePersistenceKey)
    return values
  }
}
