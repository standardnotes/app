import { ApiEndpointParam } from '@standardnotes/responses'
import { ApiVersion } from '../../Api/ApiVersion'

export type SubscriptionInviteListRequestParams = {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  [additionalParam: string]: unknown
}
