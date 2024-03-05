import { HttpResponse } from '@standardnotes/responses'
import { ApiVersion } from '../../Api'
import { ApiCallError } from '../../Error/ApiCallError'
import { ErrorMessage } from '../../Error/ErrorMessage'
import {
  GenerateRecoveryCodesResponseBody,
  RecoveryKeyParamsResponseBody,
  SignInWithRecoveryCodesResponseBody,
} from '../../Response'
import { AuthServerInterface } from '../../Server'

import { AuthApiOperations } from './AuthApiOperations'
import { AuthApiServiceInterface } from './AuthApiServiceInterface'

export class AuthApiService implements AuthApiServiceInterface {
  private operationsInProgress: Map<AuthApiOperations, boolean>

  constructor(private authServer: AuthServerInterface) {
    this.operationsInProgress = new Map()
  }

  async generateRecoveryCodes(): Promise<HttpResponse<GenerateRecoveryCodesResponseBody>> {
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
  }): Promise<HttpResponse<RecoveryKeyParamsResponseBody>> {
    if (this.operationsInProgress.get(AuthApiOperations.GetRecoveryKeyParams)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthApiOperations.GetRecoveryKeyParams, true)

    try {
      const response = await this.authServer.recoveryKeyParams({
        api_version: ApiVersion.v1,
        code_challenge: dto.codeChallenge,
        recovery_codes: dto.recoveryCodes,
        username: dto.username,
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
  }): Promise<HttpResponse<SignInWithRecoveryCodesResponseBody>> {
    if (this.operationsInProgress.get(AuthApiOperations.SignInWithRecoveryCodes)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(AuthApiOperations.SignInWithRecoveryCodes, true)

    try {
      const response = await this.authServer.signInWithRecoveryCodes({
        api_version: ApiVersion.v1,
        code_verifier: dto.codeVerifier,
        password: dto.password,
        recovery_codes: dto.recoveryCodes,
        username: dto.username,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(AuthApiOperations.SignInWithRecoveryCodes, false)
    }
  }
}
