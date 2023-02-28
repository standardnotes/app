import {
  ListAuthenticatorsResponse,
  DeleteAuthenticatorResponse,
  GenerateAuthenticatorRegistrationOptionsResponse,
  VerifyAuthenticatorRegistrationResponse,
  GenerateAuthenticatorAuthenticationOptionsResponse,
} from '../../Response'

export interface AuthenticatorApiServiceInterface {
  list(): Promise<ListAuthenticatorsResponse>
  delete(authenticatorId: string): Promise<DeleteAuthenticatorResponse>
  generateRegistrationOptions(): Promise<GenerateAuthenticatorRegistrationOptionsResponse>
  verifyRegistrationResponse(
    userUuid: string,
    name: string,
    attestationResponse: Record<string, unknown>,
  ): Promise<VerifyAuthenticatorRegistrationResponse>
  generateAuthenticationOptions(username: string): Promise<GenerateAuthenticatorAuthenticationOptionsResponse>
}
