import { isErrorResponse, AsymmetricMessageServerHash, getErrorFromErrorResponse } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class SendMessage implements UseCaseInterface<AsymmetricMessageServerHash> {
  constructor(private messageServer: AsymmetricMessageServerInterface) {}

  async execute(params: {
    recipientUuid: string
    encryptedMessage: string
    replaceabilityIdentifier: string | undefined
  }): Promise<Result<AsymmetricMessageServerHash>> {
    const response = await this.messageServer.createMessage({
      recipientUuid: params.recipientUuid,
      encryptedMessage: params.encryptedMessage,
      replaceabilityIdentifier: params.replaceabilityIdentifier,
    })

    if (isErrorResponse(response)) {
      return Result.fail(getErrorFromErrorResponse(response).message)
    }

    return Result.ok(response.data.message)
  }
}
