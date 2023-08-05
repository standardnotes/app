import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { Environment, Platform } from '@standardnotes/models'

export class IsNativeIOS implements SyncUseCaseInterface<boolean> {
  constructor(
    private environment: Environment,
    private platform: Platform,
  ) {}

  execute(): Result<boolean> {
    return Result.ok(this.environment === Environment.Mobile && this.platform === Platform.Ios)
  }
}
