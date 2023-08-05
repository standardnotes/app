import { HttpServiceInterface } from '@standardnotes/api'
import { LegacyApiServiceInterface } from '../Api/LegacyApiServiceInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class SetHost implements UseCaseInterface<void> {
  constructor(
    private http: HttpServiceInterface,
    private legacyApi: LegacyApiServiceInterface,
  ) {}

  async execute(host: string): Promise<Result<string>> {
    this.http.setHost(host)

    await this.legacyApi.setHost(host)

    return Result.ok()
  }
}
