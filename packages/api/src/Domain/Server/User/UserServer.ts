import { UserUpdateResponse } from './../../Response/User/UserUpdateResponse'
import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { UserDeletionRequestParams } from '../../Request/User/UserDeletionRequestParams'
import { UserRegistrationRequestParams } from '../../Request/User/UserRegistrationRequestParams'
import { HttpResponse } from '@standardnotes/responses'
import { UserDeletionResponseBody } from '../../Response/User/UserDeletionResponseBody'
import { UserRegistrationResponseBody } from '../../Response/User/UserRegistrationResponseBody'
import { Paths } from './Paths'
import { UserServerInterface } from './UserServerInterface'
import { UserUpdateRequestParams } from '../../Request/User/UserUpdateRequestParams'
import { UserGetPkcCredentialsResponse } from '../../Response/User/UserGetPkcCredentialsResponse'

export class UserServer implements UserServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async deleteAccount(params: UserDeletionRequestParams): Promise<HttpResponse<UserDeletionResponseBody>> {
    return this.httpService.delete(Paths.v1.deleteAccount(params.userUuid), params)
  }

  async register(params: UserRegistrationRequestParams): Promise<HttpResponse<UserRegistrationResponseBody>> {
    return this.httpService.post(Paths.v1.register, params)
  }

  async update(params: UserUpdateRequestParams): Promise<HttpResponse<UserUpdateResponse>> {
    return this.httpService.patch(Paths.v1.updateAccount(params.userUuid), params)
  }

  async getPkcCredentials(userUuid: string): Promise<HttpResponse<UserGetPkcCredentialsResponse>> {
    return this.httpService.get(Paths.v1.getPkcCredentials(userUuid))
  }
}
