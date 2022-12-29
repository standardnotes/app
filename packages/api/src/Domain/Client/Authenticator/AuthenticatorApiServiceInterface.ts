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
  delete(authenticatorId: string): Promise<DeleteAuthenticatorResponse>
  generateRegistrationOptions(
    userUuid: string,
    username: string,
  ): Promise<GenerateAuthenticatorRegistrationOptionsResponse>
  verifyRegistrationResponse(
    userUuid: string,
    name: string,
    registrationCredential: Record<string, unknown>,
  ): Promise<VerifyAuthenticatorRegistrationResponseResponse>
  generateAuthenticationOptions(): Promise<GenerateAuthenticatorAuthenticationOptionsResponse>
  verifyAuthenticationResponse(
    userUuid: string,
    authenticationCredential: Record<string, unknown>,
  ): Promise<VerifyAuthenticatorAuthenticationResponseResponse>
}
