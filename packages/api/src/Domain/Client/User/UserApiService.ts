import { RootKeyParamsInterface } from '@standardnotes/models'
import { UserRequestType } from '@standardnotes/common'

import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'
import { UserServerInterface } from '../../Server/User/UserServerInterface'
import { ApiVersion } from '../../Api/ApiVersion'
import { ApiEndpointParam } from '../../Request/ApiEndpointParam'
import { UserRequestResponse } from '../../Response/UserRequest/UserRequestResponse'
import { UserDeletionResponse } from '../../Response/User/UserDeletionResponse'
import { UserRequestServerInterface } from '../../Server/UserRequest/UserRequestServerInterface'

import { UserApiOperations } from './UserApiOperations'
import { UserApiServiceInterface } from './UserApiServiceInterface'

export class UserApiService implements UserApiServiceInterface {
  private operationsInProgress: Map<UserApiOperations, boolean>

  constructor(private userServer: UserServerInterface, private userRequestServer: UserRequestServerInterface) {
    this.operationsInProgress = new Map()
  }

  async deleteAccount(userUuid: string): Promise<UserDeletionResponse> {
    this.lockOperation(UserApiOperations.DeletingAccount)

    try {
      const response = await this.userServer.deleteAccount({
        userUuid: userUuid,
      })

      this.unlockOperation(UserApiOperations.DeletingAccount)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericRegistrationFail)
    }
  }

  async submitUserRequest(dto: { userUuid: string; requestType: UserRequestType }): Promise<UserRequestResponse> {
    this.lockOperation(UserApiOperations.SubmittingRequest)

    try {
      const response = await this.userRequestServer.submitUserRequest({
        userUuid: dto.userUuid,
        requestType: dto.requestType,
      })

      this.unlockOperation(UserApiOperations.SubmittingRequest)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericRegistrationFail)
    }
  }

  async register(registerDTO: {
    email: string
    serverPassword: string
    keyParams: RootKeyParamsInterface
    ephemeral: boolean
  }): Promise<UserRegistrationResponse> {
    this.lockOperation(UserApiOperations.Registering)

    try {
      const response = await this.userServer.register({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v0,
        password: registerDTO.serverPassword,
        email: registerDTO.email,
        ephemeral: registerDTO.ephemeral,
        ...registerDTO.keyParams.getPortableValue(),
      })

      this.unlockOperation(UserApiOperations.Registering)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericRegistrationFail)
    }
  }

  private lockOperation(operation: UserApiOperations): void {
    if (this.operationsInProgress.get(operation)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(operation, true)
  }

  private unlockOperation(operation: UserApiOperations): void {
    this.operationsInProgress.set(operation, false)
  }
}
