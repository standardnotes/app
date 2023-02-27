import { Subscription } from '@standardnotes/security'
import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'

export type GetSubscriptionResponse = DeprecatedMinimalHttpResponse & {
  data?: {
    subscription?: Subscription
  }
}
