import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'
import { CreateValetTokenResponseData } from './CreateValetTokenResponseData'

export type CreateValetTokenResponse = DeprecatedMinimalHttpResponse & {
  data: CreateValetTokenResponseData
}
