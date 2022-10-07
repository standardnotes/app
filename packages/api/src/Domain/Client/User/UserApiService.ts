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

  async register(registerDTO: {
    email: string
    serverPassword: string
    keyParams: RootKeyParamsInterface
    ephemeral: boolean
  }): Promise<UserRegistrationResponse> {
    if (this.registering) {
      throw new ApiCallError(ErrorMessage.RegistrationInProgress)
    }
    this.registering = true

    try {
      const response = await this.userServer.register({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v0,
        password: registerDTO.serverPassword,
        email: registerDTO.email,
        ephemeral: registerDTO.ephemeral,
        ...registerDTO.keyParams.getPortableValue(),
      })

      this.registering = false

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericRegistrationFail)
    }
  }
}
