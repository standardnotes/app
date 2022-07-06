import { StatusCode } from './StatusCode'
import { Error } from './Error'

export type MinimalHttpResponse = {
  status?: StatusCode
  error?: Error
  headers?: Map<string, string | null>
}
