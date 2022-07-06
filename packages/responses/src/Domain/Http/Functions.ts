import { HttpResponse } from './HttpResponse'
import { StatusCode } from './StatusCode'

export function isErrorResponseExpiredToken(errorResponse: HttpResponse): boolean {
  return errorResponse.status === StatusCode.HttpStatusExpiredAccessToken
}
