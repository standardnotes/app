import { ApiEndpointParam } from '@standardnotes/responses'

export type SubscriptionInviteDeclineRequestParams = {
  [ApiEndpointParam.ApiVersion]: string
  inviteUuid: string
  [additionalParam: string]: unknown
}
