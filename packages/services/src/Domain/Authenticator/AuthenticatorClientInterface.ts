import { Username, Uuid } from '@standardnotes/domain-core'

export interface AuthenticatorClientInterface {
  list(): Promise<Array<{ id: string; name: string }>>
  delete(authenticatorId: Uuid): Promise<boolean>
  generateRegistrationOptions(): Promise<Record<string, unknown> | null>
  verifyRegistrationResponse(
    userUuid: Uuid,
    name: string,
    registrationCredential: Record<string, unknown>,
  ): Promise<boolean>
  generateAuthenticationOptions(username: Username): Promise<Record<string, unknown> | null>
}
