import { Uuid } from '@standardnotes/common'

import { ApiEndpointParam } from '../ApiEndpointParam'
import { ApiVersion } from '../../Api/ApiVersion'

export type SubscriptionInviteDeclineRequestParams = {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  inviteUuid: Uuid
  [additionalParam: string]: unknown
}
