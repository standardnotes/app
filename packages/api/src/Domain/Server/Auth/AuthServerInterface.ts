import { HttpResponse } from '@standardnotes/responses'
import { RecoveryKeyParamsRequestParams, SignInWithRecoveryCodesRequestParams } from '../../Request'
import {
  GenerateRecoveryCodesResponseBody,
  RecoveryKeyParamsResponseBody,
  SignInWithRecoveryCodesResponseBody,
} from '../../Response'

export interface AuthServerInterface {
  generateRecoveryCodes(): Promise<HttpResponse<GenerateRecoveryCodesResponseBody>>
  recoveryKeyParams(params: RecoveryKeyParamsRequestParams): Promise<HttpResponse<RecoveryKeyParamsResponseBody>>
  signInWithRecoveryCodes(
    params: SignInWithRecoveryCodesRequestParams,
  ): Promise<HttpResponse<SignInWithRecoveryCodesResponseBody>>
}
