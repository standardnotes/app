import { HttpErrorResponseBody } from './HttpErrorResponseBody'
import { HttpResponseMeta } from './HttpResponseMeta'
import { HttpHeaders } from './HttpHeaders'
import { HttpStatusCode } from './HttpStatusCode'
import { HttpError } from './HttpError'

type AnySuccessRecord = Record<string, unknown> & { error?: never }

interface HttpResponseBase {
  status: HttpStatusCode
  meta?: HttpResponseMeta
  headers?: HttpHeaders
}

export interface HttpErrorResponse extends HttpResponseBase {
  data: HttpErrorResponseBody
}

export interface HttpSuccessResponse<T = AnySuccessRecord> extends HttpResponseBase {
  data: T
}

export type HttpResponse<T = AnySuccessRecord> = HttpErrorResponse | HttpSuccessResponse<T>

export function isErrorResponse<T>(response: HttpResponse<T>): response is HttpErrorResponse {
  return (response.data as HttpErrorResponseBody)?.error != undefined || response.status >= 400
}

export function getErrorFromErrorResponse(response: HttpErrorResponse): HttpError {
  const embeddedError = response.data.error
  if (embeddedError) {
    return embeddedError
  }

  return {
    message: 'Unknown error',
  }
}
