import { HttpResponseBody } from './HttpResponseBody'
import { HttpErrorResponseBody } from './HttpErrorResponseBody'
import { HttpResponseMeta } from './HttpResponseMeta'
import { HttpHeaders } from './HttpHeaders'
import { HttpStatusCode } from './HttpStatusCode'

export interface HttpResponse {
  status: HttpStatusCode
  data?: HttpResponseBody | HttpErrorResponseBody
  meta?: HttpResponseMeta
  headers?: HttpHeaders
}
