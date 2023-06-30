import { HttpResponse } from '@standardnotes/responses'
import { CreateAsymmetricMessageParams } from '../../Request/AsymmetricMessage/CreateAsymmetricMessageParams'
import { CreateAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/CreateAsymmetricMessageResponse'
import { GetUserAsymmetricMessagesResponse } from '../../Response/AsymmetricMessage/GetUserAsymmetricMessagesResponse'
import { DeleteAsymmetricMessageRequestParams } from '../../Request/AsymmetricMessage/DeleteAsymmetricMessageRequestParams'
import { DeleteAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/DeleteAsymmetricMessageResponse'

export interface AsymmetricMessageServerInterface {
  createMessage(params: CreateAsymmetricMessageParams): Promise<HttpResponse<CreateAsymmetricMessageResponse>>

  getInboundUserMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>>
  getOutboundUserMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>>
  getMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>>

  deleteMessage(params: DeleteAsymmetricMessageRequestParams): Promise<HttpResponse<DeleteAsymmetricMessageResponse>>
  deleteAllInboundMessages(): Promise<HttpResponse<{ success: boolean }>>
}
