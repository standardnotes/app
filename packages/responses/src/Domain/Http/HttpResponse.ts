import { HttpErrorResponseBody } from './HttpErrorResponseBody'
import { HttpResponseMeta } from './HttpResponseMeta'
import { HttpHeaders } from './HttpHeaders'
import { HttpStatusCode } from './HttpStatusCode'

interface HttpResponseBase {
  status: HttpStatusCode
  meta?: HttpResponseMeta
  headers?: HttpHeaders
}

export interface HttpErrorResponse extends HttpResponseBase {
  data?: HttpErrorResponseBody
}

export interface HttpSuccessResponse<T = Record<string, unknown> & { error?: never }> extends HttpResponseBase {
  data?: T
}

export type HttpResponse<T = Record<string, unknown> & { error?: never }> = HttpErrorResponse | HttpSuccessResponse<T>

export function isErrorResponse(response: HttpResponse): response is HttpErrorResponse {
  return !response.data || response.data?.error != undefined
}
