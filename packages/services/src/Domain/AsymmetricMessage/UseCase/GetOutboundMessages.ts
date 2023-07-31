import { isErrorResponse, AsymmetricMessageServerHash, getErrorFromErrorResponse } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class GetOutboundMessages implements UseCaseInterface<AsymmetricMessageServerHash[]> {
  constructor(private messageServer: AsymmetricMessageServerInterface) {}

  async execute(): Promise<Result<AsymmetricMessageServerHash[]>> {
    const response = await this.messageServer.getOutboundUserMessages()

    if (isErrorResponse(response)) {
      return Result.fail(getErrorFromErrorResponse(response).message)
    }

    return Result.ok(response.data.messages)
  }
}
