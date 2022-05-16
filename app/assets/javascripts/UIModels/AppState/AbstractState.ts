import { DeinitSource } from '@standardnotes/snjs'
import { WebApplication } from '../Application'

export function isStateDealloced(state: AbstractState): boolean {
  return state.dealloced == undefined || state.dealloced === true
}

export abstract class AbstractState {
  application: WebApplication
  appState?: AbstractState
  dealloced = false

  constructor(application: WebApplication, appState?: AbstractState) {
    this.application = application
    this.appState = appState
  }

  deinit(_source: DeinitSource): void {
    this.dealloced = true
    ;(this.application as unknown) = undefined
    ;(this.appState as unknown) = undefined
  }
}
