import { Uuid, Username } from '@standardnotes/domain-core'

export interface AuthenticatorClientInterface {
  list(): Promise<Array<{ id: string; name: string }>>
  delete(authenticatorId: Uuid): Promise<boolean>
  generateRegistrationOptions(userUuid: Uuid, username: Username): Promise<Record<string, unknown> | null>
  verifyRegistrationResponse(
    userUuid: Uuid,
    name: string,
    registrationCredential: Record<string, unknown>,
  ): Promise<boolean>
  generateAuthenticationOptions(): Promise<Record<string, unknown> | null>
  verifyAuthenticationResponse(userUuid: Uuid, authenticationCredential: Record<string, unknown>): Promise<boolean>
}
