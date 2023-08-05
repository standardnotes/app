import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { Environment } from '@standardnotes/models'

export class IsNativeMobileWeb implements SyncUseCaseInterface<boolean> {
  constructor(private environment: Environment) {}

  execute(): Result<boolean> {
    return Result.ok(this.environment === Environment.Mobile)
  }
}
