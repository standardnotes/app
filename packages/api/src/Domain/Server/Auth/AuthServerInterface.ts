import { HttpResponse } from '@standardnotes/responses'
import { RecoveryKeyParamsRequestParams, SignInWithRecoveryCodesRequestParams } from '../../Request'
import {
  GenerateRecoveryCodesResponseBody,
  RecoveryKeyParamsResponseBody,
  SignInWithRecoveryCodesResponseBody,
} from '../../Response'
import { HttpRequestOptions } from '../../Http/HttpRequestOptions'

export interface AuthServerInterface {
  generateRecoveryCodes(options?: HttpRequestOptions): Promise<HttpResponse<GenerateRecoveryCodesResponseBody>>
  recoveryKeyParams(params: RecoveryKeyParamsRequestParams): Promise<HttpResponse<RecoveryKeyParamsResponseBody>>
  signInWithRecoveryCodes(
    params: SignInWithRecoveryCodesRequestParams,
  ): Promise<HttpResponse<SignInWithRecoveryCodesResponseBody>>
}
