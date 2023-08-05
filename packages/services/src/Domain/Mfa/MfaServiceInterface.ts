export interface MfaServiceInterface {
  isMfaActivated(): Promise<boolean>
  generateMfaSecret(): Promise<string>
  getOtpToken(secret: string): Promise<string>
  enableMfa(secret: string, otpToken: string): Promise<void>
  disableMfa(): Promise<void>
}
