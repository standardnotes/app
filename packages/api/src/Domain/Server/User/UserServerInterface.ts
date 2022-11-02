import { UserDeletionRequestParams } from '../../Request/User/UserDeletionRequestParams'
import { UserRegistrationRequestParams } from '../../Request/User/UserRegistrationRequestParams'
import { UserDeletionResponse } from '../../Response/User/UserDeletionResponse'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'

export interface UserServerInterface {
  register(params: UserRegistrationRequestParams): Promise<UserRegistrationResponse>
  deleteAccount(params: UserDeletionRequestParams): Promise<UserDeletionResponse>
}
