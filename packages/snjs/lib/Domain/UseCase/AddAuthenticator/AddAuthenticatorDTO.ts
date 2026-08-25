export interface AddAuthenticatorDTO {
  userUuid: string
  authenticatorName: string
  /** When provided, skips the server round-trip so WebAuthn can run in the same user gesture. */
  registrationOptions?: Record<string, unknown>
}
