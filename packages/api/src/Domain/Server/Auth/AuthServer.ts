import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { RecoveryKeyParamsRequestParams, SignInWithRecoveryCodesRequestParams } from '../../Request'
import { HttpResponse } from '@standardnotes/responses'
import {
  GenerateRecoveryCodesResponseBody,
  RecoveryKeyParamsResponseBody,
  SignInWithRecoveryCodesResponseBody,
} from '../../Response'
import { AuthServerInterface } from './AuthServerInterface'
import { Paths } from './Paths'

export class AuthServer implements AuthServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async generateRecoveryCodes(): Promise<HttpResponse<GenerateRecoveryCodesResponseBody>> {
    return this.httpService.post(Paths.v1.generateRecoveryCodes)
  }

  async recoveryKeyParams(
    params: RecoveryKeyParamsRequestParams,
  ): Promise<HttpResponse<RecoveryKeyParamsResponseBody>> {
    return this.httpService.post(Paths.v1.recoveryKeyParams, params)
  }

  async signInWithRecoveryCodes(
    params: SignInWithRecoveryCodesRequestParams,
  ): Promise<HttpResponse<SignInWithRecoveryCodesResponseBody>> {
    return this.httpService.post(Paths.v1.signInWithRecoveryCodes, params)
  }
}
