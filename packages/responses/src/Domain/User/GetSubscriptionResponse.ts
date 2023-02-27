import { Subscription } from '@standardnotes/security'
import { HttpResponse } from '../Http/HttpResponse'

export type GetSubscriptionResponse = HttpResponse & {
  data?: {
    subscription?: Subscription
  }
}
