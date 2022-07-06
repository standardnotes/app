import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type PostSubscriptionTokensResponse = MinimalHttpResponse & {
  data?: {
    token: string
  }
}
