import { HttpResponse } from '../Http/HttpResponse'
import { AvailableSubscriptions } from './AvailableSubscriptions'

export type GetAvailableSubscriptionsResponse = HttpResponse & {
  data?: AvailableSubscriptions
}
