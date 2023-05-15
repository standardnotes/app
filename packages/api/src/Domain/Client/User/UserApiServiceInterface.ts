import { UserRequestType } from '@standardnotes/common'
import { type RootKeyParamsInterface } from '@standardnotes/models'
import { HttpResponse } from '@standardnotes/responses'

import { UserDeletionResponseBody } from '../../Response/User/UserDeletionResponseBody'
import { UserRegistrationResponseBody } from '../../Response/User/UserRegistrationResponseBody'
import { UserRequestResponseBody } from '../../Response/UserRequest/UserRequestResponseBody'

export interface UserApiServiceInterface {
  register(registerDTO: {
    email: string
    serverPassword: string
    keyParams: RootKeyParamsInterface
    ephemeral: boolean
    publicKey: string
    encryptedPrivateKey: string
  }): Promise<HttpResponse<UserRegistrationResponseBody>>
  submitUserRequest(dto: {
    userUuid: string
    requestType: UserRequestType
  }): Promise<HttpResponse<UserRequestResponseBody>>
  deleteAccount(userUuid: string): Promise<HttpResponse<UserDeletionResponseBody>>
}
