import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { HttpServiceInterface } from '@standardnotes/api'
import { HttpStatusCode } from '@standardnotes/responses'

export class GetTransitionStatus implements UseCaseInterface<'TO-DO' | 'STARTED' | 'FINISHED' | 'FAILED'> {
  constructor(private httpService: HttpServiceInterface) {}

  async execute(): Promise<Result<'TO-DO' | 'STARTED' | 'FINISHED' | 'FAILED'>> {
    const response = await this.httpService.get('/v1/users/transition-status')

    if (response.status !== HttpStatusCode.Success) {
      return Result.fail('Failed to get transition status')
    }

    return Result.ok((response.data as { status: 'TO-DO' | 'STARTED' | 'FINISHED' | 'FAILED' }).status)
  }
}
