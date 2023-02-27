import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { UserRegistrationResponseBody } from './UserRegistrationResponseBody'

export interface UserRegistrationResponse extends HttpResponse {
  data: UserRegistrationResponseBody | HttpErrorResponseBody
}
