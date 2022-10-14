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
    this.application.setValue(StatePersistenceKey, values)
  }

  getPersistedValues() {
    const values = this.application.getValue(StatePersistenceKey)
    return values
  }
}
