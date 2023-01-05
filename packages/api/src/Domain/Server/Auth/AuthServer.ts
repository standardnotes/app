import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import {
  GenerateRecoveryCodesRequestParams,
  RecoveryKeyParamsRequestParams,
  SignInWithRecoveryCodesRequestParams,
} from '../../Request'
import {
  GenerateRecoveryCodesResponse,
  RecoveryKeyParamsResponse,
  SignInWithRecoveryCodesResponse,
} from '../../Response'
import { AuthServerInterface } from './AuthServerInterface'
import { Paths } from './Paths'

export class AuthServer implements AuthServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async generateRecoveryCodes(params: GenerateRecoveryCodesRequestParams): Promise<GenerateRecoveryCodesResponse> {
    const response = await this.httpService.post(Paths.v1.generateRecoveryCodes, params)

    return response as GenerateRecoveryCodesResponse
  }

  async recoveryKeyParams(params: RecoveryKeyParamsRequestParams): Promise<RecoveryKeyParamsResponse> {
    const response = await this.httpService.post(Paths.v1.recoveryKeyParams, params)

    return response as RecoveryKeyParamsResponse
  }

  async signInWithRecoveryCodes(
    params: SignInWithRecoveryCodesRequestParams,
  ): Promise<SignInWithRecoveryCodesResponse> {
    const response = await this.httpService.post(Paths.v1.signInWithRecoveryCodes, params)

    return response as SignInWithRecoveryCodesResponse
  }
}
