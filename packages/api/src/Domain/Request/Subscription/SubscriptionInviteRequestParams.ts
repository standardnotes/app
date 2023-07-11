import { ApiEndpointParam } from '@standardnotes/responses'

export type SubscriptionInviteRequestParams = {
  [ApiEndpointParam.ApiVersion]: string
  identifier: string
  [additionalParam: string]: unknown
}
