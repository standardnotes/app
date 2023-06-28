import { HttpResponse } from '@standardnotes/responses'
import { UserDeletionRequestParams } from '../../Request/User/UserDeletionRequestParams'
import { UserRegistrationRequestParams } from '../../Request/User/UserRegistrationRequestParams'
import { UserDeletionResponseBody } from '../../Response/User/UserDeletionResponseBody'
import { UserRegistrationResponseBody } from '../../Response/User/UserRegistrationResponseBody'
import { UserUpdateResponse } from '../../Response/User/UserUpdateResponse'
import { UserUpdateRequestParams } from '../../Request/User/UserUpdateRequestParams'

export interface UserServerInterface {
  register(params: UserRegistrationRequestParams): Promise<HttpResponse<UserRegistrationResponseBody>>
  deleteAccount(params: UserDeletionRequestParams): Promise<HttpResponse<UserDeletionResponseBody>>
  update(params: UserUpdateRequestParams): Promise<HttpResponse<UserUpdateResponse>>
}
