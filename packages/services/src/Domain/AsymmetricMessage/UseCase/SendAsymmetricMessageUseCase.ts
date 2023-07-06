import { ClientDisplayableError, isErrorResponse, AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'

export class SendAsymmetricMessageUseCase {
  constructor(private messageServer: AsymmetricMessageServerInterface) {}

  async execute(params: {
    recipientUuid: string
    encryptedMessage: string
    replaceabilityIdentifier: string | undefined
  }): Promise<AsymmetricMessageServerHash | ClientDisplayableError> {
    const response = await this.messageServer.createMessage({
      recipientUuid: params.recipientUuid,
      encryptedMessage: params.encryptedMessage,
      replaceabilityIdentifier: params.replaceabilityIdentifier,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromNetworkError(response)
    }

    return response.data.message
  }
}
