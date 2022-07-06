import { HttpRequestParams } from './HttpRequestParams'
import { HttpResponse } from './HttpResponse'

export interface HttpServiceInterface {
  setHost(host: string): void
  get(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  post(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  put(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  patch(path: string, params: HttpRequestParams, authentication?: string): Promise<HttpResponse>
  delete(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse>
}
