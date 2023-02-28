import { HttpSuccessResponse } from '../Http/HttpResponse'
import { AvailableSubscriptions } from './AvailableSubscriptions'

export type GetAvailableSubscriptionsResponse = HttpSuccessResponse<AvailableSubscriptions>
