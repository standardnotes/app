import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'
import { CreateValetTokenResponseData } from './CreateValetTokenResponseData'

export type CreateValetTokenResponse = MinimalHttpResponse & {
  data: CreateValetTokenResponseData
}
