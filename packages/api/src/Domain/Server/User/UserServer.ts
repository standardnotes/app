import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { UserRegistrationRequestParams } from '../../Request/User/UserRegistrationRequestParams'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'
import { Paths } from './Paths'
import { UserServerInterface } from './UserServerInterface'

export class UserServer implements UserServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async register(params: UserRegistrationRequestParams): Promise<UserRegistrationResponse> {
    const response = await this.httpService.post(Paths.v1.register, params)

    return response as UserRegistrationResponse
  }
}
