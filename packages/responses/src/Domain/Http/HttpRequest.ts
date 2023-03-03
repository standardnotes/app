import { HttpRequestParams } from './HttpRequestParams'
import { HttpVerb } from './HttpVerb'

export type HttpRequest = {
  url: string
  params?: HttpRequestParams
  rawBytes?: Uint8Array
  verb: HttpVerb
  authentication?: string
  customHeaders?: Record<string, string>[]
  responseType?: XMLHttpRequestResponseType
  external?: boolean
}
