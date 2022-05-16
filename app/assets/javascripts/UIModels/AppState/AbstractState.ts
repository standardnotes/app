import { DeinitSource } from '@standardnotes/snjs'
import { WebApplication } from '../Application'

export abstract class AbstractState {
  application: WebApplication
  appState?: AbstractState

  constructor(application: WebApplication, appState?: AbstractState) {
    this.application = application
    this.appState = appState
  }

  deinit(_source: DeinitSource): void {
    ;(this.application as unknown) = undefined
    ;(this.appState as unknown) = undefined
  }
}
