import { ApplicationIdentifier } from '@standardnotes/common'

import { DeinitCallback } from './DeinitCallback'
import { DeinitMode } from './DeinitMode'
import { DeinitSource } from './DeinitSource'
import { UserClientInterface } from './UserClientInterface'

export interface ApplicationInterface {
  deinit(mode: DeinitMode, source: DeinitSource): void

  getDeinitMode(): DeinitMode

  get user(): UserClientInterface

  readonly identifier: ApplicationIdentifier
}

export interface AppGroupManagedApplication extends ApplicationInterface {
  onDeinit: DeinitCallback

  setOnDeinit(onDeinit: DeinitCallback): void
}
