import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { UserDeletionRequestParams } from '../../Request/User/UserDeletionRequestParams'
import { UserRegistrationRequestParams } from '../../Request/User/UserRegistrationRequestParams'
import { UserDeletionResponse } from '../../Response/User/UserDeletionResponse'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'
import { Paths } from './Paths'
import { UserServerInterface } from './UserServerInterface'

export class UserServer implements UserServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async deleteAccount(params: UserDeletionRequestParams): Promise<UserDeletionResponse> {
    const response = await this.httpService.delete(Paths.v1.deleteAccount(params.userUuid), params)

    return response as UserDeletionResponse
  }

  async register(params: UserRegistrationRequestParams): Promise<UserRegistrationResponse> {
    const response = await this.httpService.post(Paths.v1.register, params)

    return response as UserRegistrationResponse
  }
}
