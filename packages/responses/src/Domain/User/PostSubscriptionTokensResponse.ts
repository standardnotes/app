import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'

export type PostSubscriptionTokensResponse = DeprecatedMinimalHttpResponse & {
  data?: {
    token: string
  }
}
