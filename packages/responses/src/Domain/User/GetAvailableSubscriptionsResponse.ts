import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'
import { AvailableSubscriptions } from './AvailableSubscriptions'

export type GetAvailableSubscriptionsResponse = MinimalHttpResponse & {
  data?: AvailableSubscriptions
}
