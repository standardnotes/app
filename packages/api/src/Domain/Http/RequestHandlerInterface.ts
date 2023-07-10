import { HttpRequest, HttpResponse } from '@standardnotes/responses'

export interface RequestHandlerInterface {
  handleRequest<T>(httpRequest: HttpRequest): Promise<HttpResponse<T>>
}
