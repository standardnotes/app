import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type ListedRegistrationResponse = MinimalHttpResponse & {
  data?: unknown
}
