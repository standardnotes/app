import { Session } from '@standardnotes/domain-core'
import {
  HttpRequest,
  HttpRequestParams,
  HttpResponse,
  HttpResponseMeta,
  HttpSuccessResponse,
} from '@standardnotes/responses'

export interface HttpServiceInterface {
  setHost(host: string): void
  setSession(session: Session): void
  get<T extends HttpSuccessResponse>(
    path: string,
    params?: HttpRequestParams,
    authentication?: string,
  ): Promise<HttpResponse<T>>

  post<T extends HttpSuccessResponse>(
    path: string,
    params?: HttpRequestParams,
    authentication?: string,
  ): Promise<HttpResponse<T>>
  put<T extends HttpSuccessResponse>(
    path: string,
    params?: HttpRequestParams,
    authentication?: string,
  ): Promise<HttpResponse<T>>

  patch<T extends HttpSuccessResponse>(
    path: string,
    params: HttpRequestParams,
    authentication?: string,
  ): Promise<HttpResponse<T>>

  delete<T extends HttpSuccessResponse>(
    path: string,
    params?: HttpRequestParams,
    authentication?: string,
  ): Promise<HttpResponse<T>>

  runHttp<T extends HttpSuccessResponse>(httpRequest: HttpRequest): Promise<HttpResponse<T>>
  setCallbacks(
    updateMetaCallback: (meta: HttpResponseMeta) => void,
    refreshSessionCallback: (session: Session) => void,
  ): void
}
