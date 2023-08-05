import { LegacyApiServiceInterface } from './../Api/LegacyApiServiceInterface'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetHost implements SyncUseCaseInterface<string> {
  constructor(private legacyApi: LegacyApiServiceInterface) {}

  execute(): Result<string> {
    return Result.ok(this.legacyApi.getHost())
  }
}
