import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { CreateAsymmetricMessageParams } from '../../Request/AsymmetricMessage/CreateAsymmetricMessageParams'
import { CreateAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/CreateAsymmetricMessageResponse'
import { AsymmetricMessagesPaths } from './Paths'
import { UpdateAsymmetricMessageParams } from '../../Request/AsymmetricMessage/UpdateAsymmetricMessageParams'
import { UpdateAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/UpdateAsymmetricMessageResponse'
import { GetUserAsymmetricMessagesResponse } from '../../Response/AsymmetricMessage/GetUserAsymmetricMessagesResponse'
import { AsymmetricMessageServerInterface } from './AsymmetricMessageServerInterface'
import { DeleteAsymmetricMessageRequestParams } from '../../Request/AsymmetricMessage/DeleteAsymmetricMessageRequestParams'
import { DeleteAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/DeleteAsymmetricMessageResponse'

export class AsymmetricMessageServer implements AsymmetricMessageServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createMessage(params: CreateAsymmetricMessageParams): Promise<HttpResponse<CreateAsymmetricMessageResponse>> {
    return this.httpService.post(AsymmetricMessagesPaths.createMessage, {
      recipient_uuid: params.recipientUuid,
      sender_public_key: params.senderPublicKey,
      encrypted_message: params.encryptedMessage,
    })
  }

  updateMessage(params: UpdateAsymmetricMessageParams): Promise<HttpResponse<UpdateAsymmetricMessageResponse>> {
    return this.httpService.patch(AsymmetricMessagesPaths.updateMessage(params.messageUuid), {
      sender_public_key: params.senderPublicKey,
      encrypted_message: params.encryptedMessage,
    })
  }

  getInboundUserMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>> {
    return this.httpService.get(AsymmetricMessagesPaths.getInboundUserMessages())
  }

  getOutboundUserMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>> {
    return this.httpService.get(AsymmetricMessagesPaths.getOutboundUserMessages())
  }

  getMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>> {
    return this.httpService.get(AsymmetricMessagesPaths.getMessages)
  }

  deleteMessage(params: DeleteAsymmetricMessageRequestParams): Promise<HttpResponse<DeleteAsymmetricMessageResponse>> {
    return this.httpService.delete(AsymmetricMessagesPaths.deleteMessage(params.messageUuid))
  }

  deleteAllInboundMessages(): Promise<HttpResponse<{ success: boolean }>> {
    return this.httpService.delete(AsymmetricMessagesPaths.deleteAllInboundMessages)
  }
}
