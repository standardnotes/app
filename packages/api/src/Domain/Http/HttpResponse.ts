import { HttpStatusCode } from './HttpStatusCode'
import { HttpResponseBody } from './HttpResponseBody'
import { HttpErrorResponseBody } from './HttpErrorResponseBody'
import { HttpResponseMeta } from './HttpResponseMeta'
import { HttpHeaders } from './HttpHeaders'

export interface HttpResponse {
  status: HttpStatusCode
  data?: HttpResponseBody | HttpErrorResponseBody
  meta?: HttpResponseMeta
  headers?: HttpHeaders
}
