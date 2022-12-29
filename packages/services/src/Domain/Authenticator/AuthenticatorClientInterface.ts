export interface AuthenticatorClientInterface {
  list(): Promise<Array<{ id: string; name: string }>>
  delete(authenticatorId: string): Promise<boolean>
  generateRegistrationOptions(userUuid: string, username: string): Promise<Record<string, unknown> | null>
  verifyRegistrationResponse(
    userUuid: string,
    name: string,
    registrationCredential: Record<string, unknown>,
  ): Promise<boolean>
  generateAuthenticationOptions(): Promise<Record<string, unknown> | null>
  verifyAuthenticationResponse(userUuid: string, authenticationCredential: Record<string, unknown>): Promise<boolean>
}
