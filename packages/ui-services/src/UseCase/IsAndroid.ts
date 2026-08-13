import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { Platform } from '@standardnotes/models'

export class IsAndroid implements SyncUseCaseInterface<boolean> {
  constructor(private platform: Platform) {}

  execute(): Result<boolean> {
    return Result.ok(this.platform === Platform.Android)
  }
}
