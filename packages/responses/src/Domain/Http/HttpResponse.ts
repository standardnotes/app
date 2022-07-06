import { StatusCode } from './StatusCode'
import { Error } from './Error'
import { ResponseMeta } from './ResponseMeta'

export type HttpResponse = {
  status?: StatusCode
  error?: Error
  data?: {
    error?: Error
  }
  meta?: ResponseMeta
  headers?: Map<string, string | null>
}
