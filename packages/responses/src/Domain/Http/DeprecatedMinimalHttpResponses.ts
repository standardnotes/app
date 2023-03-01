import { DeprecatedError } from './DeprecatedError'
import { HttpStatusCode } from './HttpStatusCode'

export type DeprecatedMinimalHttpResponse = {
  status: HttpStatusCode
  error?: DeprecatedError
  headers?: Map<string, string | null>
}
