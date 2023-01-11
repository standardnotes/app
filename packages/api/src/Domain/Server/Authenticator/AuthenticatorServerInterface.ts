import {
  ListAuthenticatorsRequestParams,
  DeleteAuthenticatorRequestParams,
  VerifyAuthenticatorRegistrationResponseRequestParams,
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
  generateRegistrationOptions(): Promise<GenerateAuthenticatorRegistrationOptionsResponse>
  verifyRegistrationResponse(
    params: VerifyAuthenticatorRegistrationResponseRequestParams,
  ): Promise<VerifyAuthenticatorRegistrationResponseResponse>
  generateAuthenticationOptions(): Promise<GenerateAuthenticatorAuthenticationOptionsResponse>
  verifyAuthenticationResponse(
    params: VerifyAuthenticatorAuthenticationResponseRequestParams,
  ): Promise<VerifyAuthenticatorAuthenticationResponseResponse>
}
