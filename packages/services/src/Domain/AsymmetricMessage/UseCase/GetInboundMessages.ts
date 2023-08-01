import { isErrorResponse, AsymmetricMessageServerHash, getErrorFromErrorResponse } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class GetInboundMessages implements UseCaseInterface<AsymmetricMessageServerHash[]> {
  constructor(private messageServer: AsymmetricMessageServerInterface) {}

  async execute(): Promise<Result<AsymmetricMessageServerHash[]>> {
    const response = await this.messageServer.getMessages()

    if (isErrorResponse(response)) {
      return Result.fail(getErrorFromErrorResponse(response).message)
    }

    return Result.ok(response.data.messages)
  }
}
