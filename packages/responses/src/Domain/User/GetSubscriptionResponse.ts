import { Subscription } from '@standardnotes/security'
import { HttpSuccessResponse } from '../Http/HttpResponse'

export type GetSubscriptionResponse = HttpSuccessResponse<{
  subscription?: Subscription
}>
