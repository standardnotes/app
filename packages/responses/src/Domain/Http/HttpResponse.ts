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

export function getCaptchaHeader<T>(response: HttpResponse<T>) {
  const captchaHeader = response.headers?.get('x-captcha-required')
  if (captchaHeader) {
    return captchaHeader
  }
  return null
}

export function getErrorMessageFromErrorResponseBody(data: HttpErrorResponseBody, defaultMessage?: string): string {
  let errorMessage = defaultMessage || 'Unknown error'
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    data.error &&
    typeof data.error === 'object' &&
    'message' in data.error
  ) {
    errorMessage = data.error.message as string
  }

  return errorMessage
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
