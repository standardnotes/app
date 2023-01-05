import { RecoveryKeyParamsRequestParams, SignInWithRecoveryCodesRequestParams } from '../../Request'
import {
  GenerateRecoveryCodesResponse,
  RecoveryKeyParamsResponse,
  SignInWithRecoveryCodesResponse,
} from '../../Response'

export interface AuthServerInterface {
  generateRecoveryCodes(): Promise<GenerateRecoveryCodesResponse>
  recoveryKeyParams(params: RecoveryKeyParamsRequestParams): Promise<RecoveryKeyParamsResponse>
  signInWithRecoveryCodes(params: SignInWithRecoveryCodesRequestParams): Promise<SignInWithRecoveryCodesResponse>
}
