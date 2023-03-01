import { HttpResponse } from '@standardnotes/responses'
import { UserRequestRequestParams } from '../../Request/UserRequest/UserRequestRequestParams'
import { UserRequestResponseBody } from '../../Response/UserRequest/UserRequestResponseBody'

export interface UserRequestServerInterface {
  submitUserRequest(params: UserRequestRequestParams): Promise<HttpResponse<UserRequestResponseBody>>
}
