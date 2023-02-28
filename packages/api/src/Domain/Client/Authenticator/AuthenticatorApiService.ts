import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { HttpResponse } from '@standardnotes/responses'

import { AuthenticatorApiServiceInterface } from './AuthenticatorApiServiceInterface'
import { AuthenticatorApiOperations } from './AuthenticatorApiOperations'
import {
  ListAuthenticatorsResponseBody,
  DeleteAuthenticatorResponseBody,
  GenerateAuthenticatorRegistrationOptionsResponseBody,
  VerifyAuthenticatorRegistrationResponseBody,
  GenerateAuthenticatorAuthenticationOptionsResponseBody,
} from '../../Response'
import { AuthenticatorServerInterface } from '../../Server/Authenticator/AuthenticatorServerInterface'

export class AuthenticatorApiService implements AuthenticatorApiServiceInterface {
  private operationsInProgress: Map<AuthenticatorApiOperations, boolean>

  constructor(private authenticatorServer: AuthenticatorServerInterface) {
    this.operationsInProgress = new Map()
  }

  async list(): Promise<HttpResponse<ListAuthenticatorsResponseBody>> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.List)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.List, true)

    try {
      const response = await this.authenticatorServer.list({})

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.List, false)
    }
  }

  async delete(authenticatorId: string): Promise<HttpResponse<DeleteAuthenticatorResponseBody>> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.Delete)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.Delete, true)

    try {
      const response = await this.authenticatorServer.delete({
        authenticatorId,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.Delete, false)
    }
  }

  async generateRegistrationOptions(): Promise<HttpResponse<GenerateAuthenticatorRegistrationOptionsResponseBody>> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.GenerateRegistrationOptions)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.GenerateRegistrationOptions, true)

    try {
      const response = await this.authenticatorServer.generateRegistrationOptions()

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.GenerateRegistrationOptions, false)
    }
  }

  async verifyRegistrationResponse(
    userUuid: string,
    name: string,
    attestationResponse: Record<string, unknown>,
  ): Promise<HttpResponse<VerifyAuthenticatorRegistrationResponseBody>> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.VerifyRegistrationResponse)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.VerifyRegistrationResponse, true)

    try {
      const response = await this.authenticatorServer.verifyRegistrationResponse({
        userUuid,
        name,
        attestationResponse,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.VerifyRegistrationResponse, false)
    }
  }

  async generateAuthenticationOptions(
    username: string,
  ): Promise<HttpResponse<GenerateAuthenticatorAuthenticationOptionsResponseBody>> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.GenerateAuthenticationOptions)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.GenerateAuthenticationOptions, true)

    try {
      const response = await this.authenticatorServer.generateAuthenticationOptions({
        username,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.GenerateAuthenticationOptions, false)
    }
  }
}
