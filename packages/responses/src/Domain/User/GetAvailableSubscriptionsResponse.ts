import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'
import { AvailableSubscriptions } from './AvailableSubscriptions'

export type GetAvailableSubscriptionsResponse = DeprecatedMinimalHttpResponse & {
  data?: AvailableSubscriptions
}
