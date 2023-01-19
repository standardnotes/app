import {
  ListAuthenticatorsResponse,
  DeleteAuthenticatorResponse,
  GenerateAuthenticatorRegistrationOptionsResponse,
  VerifyAuthenticatorRegistrationResponseResponse,
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
  ): Promise<VerifyAuthenticatorRegistrationResponseResponse>
  generateAuthenticationOptions(username: string): Promise<GenerateAuthenticatorAuthenticationOptionsResponse>
}
