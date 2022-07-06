import { UserRegistrationRequestParams } from '../../Request/User/UserRegistrationRequestParams'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'

export interface UserServerInterface {
  register(params: UserRegistrationRequestParams): Promise<UserRegistrationResponse>
}
