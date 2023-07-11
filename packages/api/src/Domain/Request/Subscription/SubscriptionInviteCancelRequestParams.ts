import { ApiEndpointParam } from '@standardnotes/responses'

export type SubscriptionInviteCancelRequestParams = {
  [ApiEndpointParam.ApiVersion]: string
  inviteUuid: string
  [additionalParam: string]: unknown
}
