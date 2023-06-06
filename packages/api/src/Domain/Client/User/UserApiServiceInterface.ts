import { UserRequestType } from '@standardnotes/common'
import { type RootKeyParamsInterface } from '@standardnotes/models'
import { HttpResponse } from '@standardnotes/responses'

import { UserDeletionResponseBody } from '../../Response/User/UserDeletionResponseBody'
import { UserRegistrationResponseBody } from '../../Response/User/UserRegistrationResponseBody'
import { UserRequestResponseBody } from '../../Response/UserRequest/UserRequestResponseBody'
import { UserGetUserResponse } from '../../Response/User/UserGetPkcCredentialsResponse'
import { UserUpdateResponse } from '../../Response/User/UserUpdateResponse'

export interface UserApiServiceInterface {
  register(registerDTO: {
    email: string
    serverPassword: string
    keyParams: RootKeyParamsInterface
    ephemeral: boolean
    publicKey: string
    signingPublicKey: string
  }): Promise<HttpResponse<UserRegistrationResponseBody>>
  updateUser(updateDTO: {
    userUuid: string
    publicKey: string
    signingPublicKey: string
  }): Promise<HttpResponse<UserUpdateResponse>>

  submitUserRequest(dto: {
    userUuid: string
    requestType: UserRequestType
  }): Promise<HttpResponse<UserRequestResponseBody>>

  deleteAccount(userUuid: string): Promise<HttpResponse<UserDeletionResponseBody>>
  getCurrentUser(userUuid: string): Promise<HttpResponse<UserGetUserResponse>>
}
