import {
  ListAuthenticatorsRequestParams,
  DeleteAuthenticatorRequestParams,
  GenerateAuthenticatorRegistrationOptionsRequestParams,
  VerifyAuthenticatorRegistrationResponseRequestParams,
  GenerateAuthenticatorAuthenticationOptionsRequestParams,
  VerifyAuthenticatorAuthenticationResponseRequestParams,
} from '../../Request'
import {
  ListAuthenticatorsResponse,
  DeleteAuthenticatorResponse,
  GenerateAuthenticatorRegistrationOptionsResponse,
  VerifyAuthenticatorRegistrationResponseResponse,
  GenerateAuthenticatorAuthenticationOptionsResponse,
  VerifyAuthenticatorAuthenticationResponseResponse,
} from '../../Response'

export interface AuthenticatorServerInterface {
  list(params: ListAuthenticatorsRequestParams): Promise<ListAuthenticatorsResponse>
  delete(params: DeleteAuthenticatorRequestParams): Promise<DeleteAuthenticatorResponse>
  generateRegistrationOptions(
    params: GenerateAuthenticatorRegistrationOptionsRequestParams,
  ): Promise<GenerateAuthenticatorRegistrationOptionsResponse>
  verifyRegistrationResponse(
    params: VerifyAuthenticatorRegistrationResponseRequestParams,
  ): Promise<VerifyAuthenticatorRegistrationResponseResponse>
  generateAuthenticationOptions(
    params: GenerateAuthenticatorAuthenticationOptionsRequestParams,
  ): Promise<GenerateAuthenticatorAuthenticationOptionsResponse>
  verifyAuthenticationResponse(
    params: VerifyAuthenticatorAuthenticationResponseRequestParams,
  ): Promise<VerifyAuthenticatorAuthenticationResponseResponse>
}
