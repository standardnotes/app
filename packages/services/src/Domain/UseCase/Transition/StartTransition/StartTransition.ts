import { HttpServiceInterface } from '@standardnotes/api'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { HttpStatusCode } from '@standardnotes/responses'

export class StartTransition implements UseCaseInterface<void> {
  constructor(private httpService: HttpServiceInterface) {}

  async execute(): Promise<Result<void>> {
    const response = await this.httpService.post('/v1/items/transition')

    if (response.status !== HttpStatusCode.Success) {
      return Result.fail('Failed to start transition')
    }

    return Result.ok()
  }
}
