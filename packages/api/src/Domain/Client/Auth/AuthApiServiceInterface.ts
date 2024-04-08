import { HttpResponse } from '@standardnotes/responses'
import {
  GenerateRecoveryCodesResponseBody,
  RecoveryKeyParamsResponseBody,
  SignInWithRecoveryCodesResponseBody,
} from '../../Response'

export interface AuthApiServiceInterface {
  generateRecoveryCodes(): Promise<HttpResponse<GenerateRecoveryCodesResponseBody>>
  recoveryKeyParams(dto: {
    username: string
    codeChallenge: string
    recoveryCodes: string
  }): Promise<HttpResponse<RecoveryKeyParamsResponseBody>>
  signInWithRecoveryCodes(dto: {
    username: string
    password: string
    codeVerifier: string
    recoveryCodes: string
    hvmToken?: string
  }): Promise<HttpResponse<SignInWithRecoveryCodesResponseBody>>
}
