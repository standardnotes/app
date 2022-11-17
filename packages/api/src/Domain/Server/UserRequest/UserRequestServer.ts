import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { UserRequestRequestParams } from '../../Request/UserRequest/UserRequestRequestParams'
import { UserRequestResponse } from '../../Response/UserRequest/UserRequestResponse'

import { Paths } from './Paths'
import { UserRequestServerInterface } from './UserRequestServerInterface'

export class UserRequestServer implements UserRequestServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async submitUserRequest(params: UserRequestRequestParams): Promise<UserRequestResponse> {
    const response = await this.httpService.post(Paths.v1.submitUserRequest(params.userUuid), params)

    return response as UserRequestResponse
  }
}
