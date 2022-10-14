import { AbstractService, ApplicationInterface, InternalEventBusInterface } from '@standardnotes/services'

export class StatePersistenceService extends AbstractService {
  constructor(
    protected application: ApplicationInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }
}
