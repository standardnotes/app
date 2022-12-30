import { Username, Uuid } from '@standardnotes/domain-core'
import {
  ListAuthenticatorsResponse,
  DeleteAuthenticatorResponse,
  GenerateAuthenticatorRegistrationOptionsResponse,
  VerifyAuthenticatorRegistrationResponseResponse,
  GenerateAuthenticatorAuthenticationOptionsResponse,
  VerifyAuthenticatorAuthenticationResponseResponse,
} from '../../Response'

export interface AuthenticatorApiServiceInterface {
  list(): Promise<ListAuthenticatorsResponse>
  delete(authenticatorId: Uuid): Promise<DeleteAuthenticatorResponse>
  generateRegistrationOptions(
    userUuid: Uuid,
    username: Username,
  ): Promise<GenerateAuthenticatorRegistrationOptionsResponse>
  verifyRegistrationResponse(
    userUuid: Uuid,
    name: string,
    registrationCredential: Record<string, unknown>,
  ): Promise<VerifyAuthenticatorRegistrationResponseResponse>
  generateAuthenticationOptions(): Promise<GenerateAuthenticatorAuthenticationOptionsResponse>
  verifyAuthenticationResponse(
    userUuid: Uuid,
    authenticationCredential: Record<string, unknown>,
  ): Promise<VerifyAuthenticatorAuthenticationResponseResponse>
}
