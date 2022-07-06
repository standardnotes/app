import { Subscription } from '@standardnotes/security'
import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type GetSubscriptionResponse = MinimalHttpResponse & {
  data?: {
    subscription?: Subscription
  }
}
