import { ClientDisplayableError, isErrorResponse, AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'

export class SendAsymmetricMessageUseCase {
  constructor(private messageServer: AsymmetricMessageServerInterface) {}

  async execute(params: {
    recipientUuid: string
    encryptedMessage: string
  }): Promise<AsymmetricMessageServerHash | ClientDisplayableError> {
    const response = await this.messageServer.createMessage({
      recipientUuid: params.recipientUuid,
      encryptedMessage: params.encryptedMessage,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.message
  }
}
