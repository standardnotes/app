import { HttpSuccessResponse } from '../Http/HttpResponse'

export type PostSubscriptionTokensResponse = HttpSuccessResponse<{
  token: string
}>
