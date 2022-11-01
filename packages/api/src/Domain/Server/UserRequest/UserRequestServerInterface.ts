import { UserRequestRequestParams } from '../../Request/UserRequest/UserRequestRequestParams'
import { UserRequestResponse } from '../../Response/UserRequest/UserRequestResponse'

export interface UserRequestServerInterface {
  submitUserRequest(params: UserRequestRequestParams): Promise<UserRequestResponse>
}
