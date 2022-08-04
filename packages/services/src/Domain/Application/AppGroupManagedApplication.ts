import { ApplicationInterface } from './ApplicationInterface'
import { DeinitCallback } from './DeinitCallback'

export interface AppGroupManagedApplication extends ApplicationInterface {
  onDeinit: DeinitCallback
  setOnDeinit(onDeinit: DeinitCallback): void
}
