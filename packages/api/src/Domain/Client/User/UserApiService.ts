import { type RootKeyParamsInterface } from '@standardnotes/models'
import { UserRequestType } from '@standardnotes/common'

import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { UserServerInterface } from '../../Server/User/UserServerInterface'
import { ApiVersion } from '../../Api/ApiVersion'
import { HttpResponse, ApiEndpointParam } from '@standardnotes/responses'

import { UserDeletionResponseBody } from '../../Response/User/UserDeletionResponseBody'
import { UserRegistrationResponseBody } from '../../Response/User/UserRegistrationResponseBody'
import { UserRequestResponseBody } from '../../Response/UserRequest/UserRequestResponseBody'
import { UserRequestServerInterface } from '../../Server/UserRequest/UserRequestServerInterface'

import { UserApiOperations } from './UserApiOperations'
import { UserApiServiceInterface } from './UserApiServiceInterface'
import { UserUpdateResponse } from '../../Response/User/UserUpdateResponse'

export class UserApiService implements UserApiServiceInterface {
  private operationsInProgress: Map<UserApiOperations, boolean>

  constructor(
    private userServer: UserServerInterface,
    private userRequestServer: UserRequestServerInterface,
  ) {
    this.operationsInProgress = new Map()
  }

  async deleteAccount(userUuid: string): Promise<HttpResponse<UserDeletionResponseBody>> {
    this.lockOperation(UserApiOperations.DeletingAccount)

    try {
      const response = await this.userServer.deleteAccount({
        userUuid: userUuid,
      })

      this.unlockOperation(UserApiOperations.DeletingAccount)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }

  async submitUserRequest(dto: {
    userUuid: string
    requestType: UserRequestType
  }): Promise<HttpResponse<UserRequestResponseBody>> {
    this.lockOperation(UserApiOperations.SubmittingRequest)

    try {
      const response = await this.userRequestServer.submitUserRequest({
        userUuid: dto.userUuid,
        requestType: dto.requestType,
      })

      this.unlockOperation(UserApiOperations.SubmittingRequest)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }

  async register(registerDTO: {
    email: string
    serverPassword: string
    keyParams: RootKeyParamsInterface
    ephemeral: boolean
  }): Promise<HttpResponse<UserRegistrationResponseBody>> {
    this.lockOperation(UserApiOperations.Registering)

    try {
      const response = await this.userServer.register({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v1,
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

  async updateUser(updateDTO: { userUuid: string }): Promise<HttpResponse<UserUpdateResponse>> {
    this.lockOperation(UserApiOperations.UpdatingUser)

    try {
      const response = await this.userServer.update({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v1,
        user_uuid: updateDTO.userUuid,
      })

      this.unlockOperation(UserApiOperations.UpdatingUser)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
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
