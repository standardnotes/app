import { DeprecatedError } from './DeprecatedError'
import { HttpStatusCode } from './HttpStatusCode'
import { DeprecatedResponseMeta } from './DeprecatedResponseMeta'

export type DeprecatedHttpResponse = {
  status: HttpStatusCode
  error?: DeprecatedError
  data?: {
    error?: DeprecatedError
  }
  meta?: DeprecatedResponseMeta
  headers?: Map<string, string | null>
}
