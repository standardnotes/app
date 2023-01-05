import {
  GenerateRecoveryCodesResponse,
  RecoveryKeyParamsResponse,
  SignInWithRecoveryCodesResponse,
} from '../../Response'

export interface AuthApiServiceInterface {
  generateRecoveryCodes(): Promise<GenerateRecoveryCodesResponse>
  recoveryKeyParams(dto: {
    username: string
    codeChallenge: string
    recoveryCodes: string
  }): Promise<RecoveryKeyParamsResponse>
  signInWithRecoveryCodes(dto: {
    username: string
    password: string
    codeVerifier: string
    recoveryCodes: string
  }): Promise<SignInWithRecoveryCodesResponse>
}
