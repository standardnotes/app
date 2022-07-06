import { HttpResponse, MinimalHttpResponse } from '@standardnotes/responses'

export interface UserServerInterface {
  deleteAccount(userUuid: string): Promise<HttpResponse | MinimalHttpResponse>
}
