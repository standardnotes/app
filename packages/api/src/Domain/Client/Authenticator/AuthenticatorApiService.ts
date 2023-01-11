import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'

import { AuthenticatorApiServiceInterface } from './AuthenticatorApiServiceInterface'
import { AuthenticatorApiOperations } from './AuthenticatorApiOperations'
import {
  ListAuthenticatorsResponse,
  DeleteAuthenticatorResponse,
  GenerateAuthenticatorRegistrationOptionsResponse,
  VerifyAuthenticatorRegistrationResponseResponse,
  GenerateAuthenticatorAuthenticationOptionsResponse,
  VerifyAuthenticatorAuthenticationResponseResponse,
} from '../../Response'
import { AuthenticatorServerInterface } from '../../Server/Authenticator/AuthenticatorServerInterface'

export class AuthenticatorApiService implements AuthenticatorApiServiceInterface {
  private operationsInProgress: Map<AuthenticatorApiOperations, boolean>

  constructor(private authenticatorServer: AuthenticatorServerInterface) {
    this.operationsInProgress = new Map()
  }

  async list(): Promise<ListAuthenticatorsResponse> {
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

  async delete(authenticatorId: string): Promise<DeleteAuthenticatorResponse> {
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

  async generateRegistrationOptions(): Promise<GenerateAuthenticatorRegistrationOptionsResponse> {
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
    registrationCredential: Record<string, unknown>,
  ): Promise<VerifyAuthenticatorRegistrationResponseResponse> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.VerifyRegistrationResponse)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.VerifyRegistrationResponse, true)

    try {
      const response = await this.authenticatorServer.verifyRegistrationResponse({
        userUuid,
        name,
        registrationCredential,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.VerifyRegistrationResponse, false)
    }
  }

  async generateAuthenticationOptions(): Promise<GenerateAuthenticatorAuthenticationOptionsResponse> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.GenerateAuthenticationOptions)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.GenerateAuthenticationOptions, true)

    try {
      const response = await this.authenticatorServer.generateAuthenticationOptions()

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.GenerateAuthenticationOptions, false)
    }
  }

  async verifyAuthenticationResponse(
    userUuid: string,
    authenticationCredential: Record<string, unknown>,
  ): Promise<VerifyAuthenticatorAuthenticationResponseResponse> {
    if (this.operationsInProgress.get(AuthenticatorApiOperations.VerifyAuthenticationResponse)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthenticatorApiOperations.VerifyAuthenticationResponse, true)

    try {
      const response = await this.authenticatorServer.verifyAuthenticationResponse({
        authenticationCredential,
        userUuid,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthenticatorApiOperations.VerifyAuthenticationResponse, false)
    }
  }
}
