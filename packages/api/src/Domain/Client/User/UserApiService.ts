import { RootKeyParamsInterface } from '@standardnotes/models'

import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'
import { UserServerInterface } from '../../Server/User/UserServerInterface'
import { ApiVersion } from '../../Api/ApiVersion'
import { ApiEndpointParam } from '../../Request/ApiEndpointParam'
import { UserApiServiceInterface } from './UserApiServiceInterface'

export class UserApiService implements UserApiServiceInterface {
  private registering: boolean

  constructor(private userServer: UserServerInterface) {
    this.registering = false
  }

  async register(
    email: string,
    serverPassword: string,
    keyParams: RootKeyParamsInterface,
    ephemeral: boolean,
  ): Promise<UserRegistrationResponse> {
    if (this.registering) {
      throw new ApiCallError(ErrorMessage.RegistrationInProgress)
    }
    this.registering = true

    try {
      const response = await this.userServer.register({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v0,
        password: serverPassword,
        email,
        ephemeral,
        ...keyParams.getPortableValue(),
      })

      this.registering = false

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericRegistrationFail)
    }
  }
}
