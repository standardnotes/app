import { ClientDisplayableError, isErrorResponse, AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'

export class GetOutboundAsymmetricMessages {
  constructor(private messageServer: AsymmetricMessageServerInterface) {}

  async execute(): Promise<AsymmetricMessageServerHash[] | ClientDisplayableError> {
    const response = await this.messageServer.getOutboundUserMessages()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.messages
  }
}
