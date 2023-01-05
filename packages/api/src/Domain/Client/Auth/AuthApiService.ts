import { ApiVersion } from '../../Api'
import { ApiCallError } from '../../Error/ApiCallError'
import { ErrorMessage } from '../../Error/ErrorMessage'
import {
  GenerateRecoveryCodesResponse,
  RecoveryKeyParamsResponse,
  SignInWithRecoveryCodesResponse,
} from '../../Response'
import { AuthServerInterface } from '../../Server'

import { AuthApiOperations } from './AuthApiOperations'
import { AuthApiServiceInterface } from './AuthApiServiceInterface'

export class AuthApiService implements AuthApiServiceInterface {
  private operationsInProgress: Map<AuthApiOperations, boolean>

  constructor(private authServer: AuthServerInterface) {
    this.operationsInProgress = new Map()
  }

  async generateRecoveryCodes(): Promise<GenerateRecoveryCodesResponse> {
    if (this.operationsInProgress.get(AuthApiOperations.GenerateRecoveryCodes)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthApiOperations.GenerateRecoveryCodes, true)

    try {
      const response = await this.authServer.generateRecoveryCodes()

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthApiOperations.GenerateRecoveryCodes, false)
    }
  }

  async recoveryKeyParams(dto: {
    username: string
    codeChallenge: string
    recoveryCodes: string
  }): Promise<RecoveryKeyParamsResponse> {
    if (this.operationsInProgress.get(AuthApiOperations.GetRecoveryKeyParams)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthApiOperations.GetRecoveryKeyParams, true)

    try {
      const response = await this.authServer.recoveryKeyParams({
        apiVersion: ApiVersion.v0,
        ...dto,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthApiOperations.GetRecoveryKeyParams, false)
    }
  }

  async signInWithRecoveryCodes(dto: {
    username: string
    password: string
    codeVerifier: string
    recoveryCodes: string
  }): Promise<SignInWithRecoveryCodesResponse> {
    if (this.operationsInProgress.get(AuthApiOperations.SignInWithRecoveryCodes)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthApiOperations.SignInWithRecoveryCodes, true)

    try {
      const response = await this.authServer.signInWithRecoveryCodes({
        apiVersion: ApiVersion.v0,
        ...dto,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthApiOperations.SignInWithRecoveryCodes, false)
    }
  }
}
