import { Session } from '@standardnotes/domain-core'
import { HttpRequest, HttpRequestParams, HttpResponse, HttpResponseMeta } from '@standardnotes/responses'

export interface HttpServiceInterface {
  setHost(host: string): void
  setSession(session: Session): void
  get(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  post(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  put(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  patch(path: string, params: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  delete(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  runHttp(httpRequest: HttpRequest): Promise<HttpResponse>
  setCallbacks(
    updateMetaCallback: (meta: HttpResponseMeta) => void,
    refreshSessionCallback: (session: Session) => void,
  ): void
}
