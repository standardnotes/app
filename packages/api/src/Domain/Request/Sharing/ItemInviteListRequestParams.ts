import { ApiEndpointParam } from '../ApiEndpointParam'
import { ApiVersion } from '../../Api/ApiVersion'

export type ItemInviteListRequestParams = {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  [additionalParam: string]: unknown
}
