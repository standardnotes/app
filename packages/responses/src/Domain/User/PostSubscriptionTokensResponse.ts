import { HttpResponse } from '../Http/HttpResponse'

export type PostSubscriptionTokensResponse = HttpResponse & {
  data?: {
    token: string
  }
}
