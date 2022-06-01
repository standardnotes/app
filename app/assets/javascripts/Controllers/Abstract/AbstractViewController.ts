import { DeinitSource } from '@standardnotes/snjs'
import { WebApplication } from '../../Application/Application'

export abstract class AbstractViewController {
  dealloced = false

  constructor(public application: WebApplication, public viewControllerManager?: AbstractViewController) {}

  deinit(_source: DeinitSource): void {
    this.dealloced = true
    ;(this.application as unknown) = undefined
    ;(this.viewControllerManager as unknown) = undefined
  }
}
