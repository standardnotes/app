import { HttpResponse } from '@standardnotes/responses'
import { CreateAsymmetricMessageParams } from '../../Request/AsymmetricMessage/CreateAsymmetricMessageParams'
import { CreateAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/CreateAsymmetricMessageResponse'
import { UpdateAsymmetricMessageParams } from '../../Request/AsymmetricMessage/UpdateAsymmetricMessageParams'
import { UpdateAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/UpdateAsymmetricMessageResponse'
import { GetUserAsymmetricMessagesResponse } from '../../Response/AsymmetricMessage/GetUserAsymmetricMessagesResponse'
import { DeleteAsymmetricMessageRequestParams } from '../../Request/AsymmetricMessage/DeleteAsymmetricMessageRequestParams'
import { DeleteAsymmetricMessageResponse } from '../../Response/AsymmetricMessage/DeleteAsymmetricMessageResponse'

export interface AsymmetricMessageServerInterface {
  createMessage(params: CreateAsymmetricMessageParams): Promise<HttpResponse<CreateAsymmetricMessageResponse>>
  updateMessage(params: UpdateAsymmetricMessageParams): Promise<HttpResponse<UpdateAsymmetricMessageResponse>>

  getInboundUserMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>>
  getOutboundUserMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>>
  getMessages(): Promise<HttpResponse<GetUserAsymmetricMessagesResponse>>

  deleteMessage(params: DeleteAsymmetricMessageRequestParams): Promise<HttpResponse<DeleteAsymmetricMessageResponse>>
  deleteAllInboundMessages(): Promise<HttpResponse<{ success: boolean }>>
}
