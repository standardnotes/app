export interface VerifyAuthenticatorAuthenticationResponseRequestParams {
  userUuid: string
  authenticationCredential: Record<string, unknown>
  [additionalParam: string]: unknown
}
