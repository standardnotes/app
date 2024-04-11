export interface SignInWithRecoveryCodesDTO {
  recoveryCodes: string
  username: string
  password: string
  hvmToken?: string
}
