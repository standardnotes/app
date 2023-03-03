import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { UserRequestRequestParams } from '../../Request/UserRequest/UserRequestRequestParams'
import { HttpResponse } from '@standardnotes/responses'
import { UserRequestResponseBody } from '../../Response/UserRequest/UserRequestResponseBody'

import { Paths } from './Paths'
import { UserRequestServerInterface } from './UserRequestServerInterface'

export class UserRequestServer implements UserRequestServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async submitUserRequest(params: UserRequestRequestParams): Promise<HttpResponse<UserRequestResponseBody>> {
    return this.httpService.post(Paths.v1.submitUserRequest(params.userUuid), params)
  }
}
