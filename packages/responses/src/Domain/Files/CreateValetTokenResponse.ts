import { HttpResponse } from '../Http/HttpResponse'
import { CreateValetTokenResponseData } from './CreateValetTokenResponseData'

export type CreateValetTokenResponse = HttpResponse & {
  data: CreateValetTokenResponseData
}
