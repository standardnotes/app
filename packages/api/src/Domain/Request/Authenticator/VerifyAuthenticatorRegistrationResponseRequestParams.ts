export interface VerifyAuthenticatorRegistrationResponseRequestParams {
  userUuid: string
  name: string
  registrationCredential: Record<string, unknown>
  [additionalParam: string]: unknown
}
