import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { UserRegistrationResponseBody } from './UserRegistrationResponseBody'

export interface UserRegistrationResponse extends HttpResponse {
  data: UserRegistrationResponseBody | HttpErrorResponseBody
}
