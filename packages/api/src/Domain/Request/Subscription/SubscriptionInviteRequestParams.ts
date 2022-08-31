import { ApiEndpointParam } from '../ApiEndpointParam'
import { ApiVersion } from '../../Api/ApiVersion'

export type SubscriptionInviteRequestParams = {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  identifier: string
  [additionalParam: string]: unknown
}
