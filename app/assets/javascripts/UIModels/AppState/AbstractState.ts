import { DeinitSource, ApplicationInterface } from '@standardnotes/snjs'

export function isStateDealloced(state: AbstractState): boolean {
  return state.dealloced == undefined || state.dealloced === true
}

export abstract class AbstractState {
  application: ApplicationInterface
  appState?: AbstractState
  dealloced = false

  constructor(application: ApplicationInterface, appState?: AbstractState) {
    this.application = application
    this.appState = appState
  }

  deinit(_source: DeinitSource): void {
    this.dealloced = true
    ;(this.application as unknown) = undefined
    ;(this.appState as unknown) = undefined
  }
}
