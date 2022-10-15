import { WebApplication } from './../../Application/Application'

export type MasterPersistedValue = Record<string, unknown>

export class PersistenceService {
  constructor(private application: WebApplication) {}

  persistValues(values: MasterPersistedValue): void {
    this.application.setValue('master-persisted-value', values)
  }

  getPersistedValues(): MasterPersistedValue {
    return this.application.getValue('master-persisted-value') as MasterPersistedValue
  }
}
