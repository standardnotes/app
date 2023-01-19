export interface VerifyAuthenticatorRegistrationResponseRequestParams {
  userUuid: string
  name: string
  attestationResponse: Record<string, unknown>
  [additionalParam: string]: unknown
}
