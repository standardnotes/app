import { UserRequestType, Uuid } from '@standardnotes/common'
import { RootKeyParamsInterface } from '@standardnotes/models'

import { UserDeletionResponse } from '../../Response/User/UserDeletionResponse'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'
import { UserRequestResponse } from '../../Response/UserRequest/UserRequestResponse'

export interface UserApiServiceInterface {
  register(registerDTO: {
    email: string
    serverPassword: string
    keyParams: RootKeyParamsInterface
    ephemeral: boolean
  }): Promise<UserRegistrationResponse>
  submitUserRequest(dto: { userUuid: Uuid; requestType: UserRequestType }): Promise<UserRequestResponse>
  deleteAccount(userUuid: string): Promise<UserDeletionResponse>
}
