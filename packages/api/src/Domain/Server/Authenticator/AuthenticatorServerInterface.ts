import {
  ListAuthenticatorsRequestParams,
  DeleteAuthenticatorRequestParams,
  VerifyAuthenticatorRegistrationResponseRequestParams,
  GenerateAuthenticatorAuthenticationOptionsRequestParams,
} from '../../Request'
import {
  ListAuthenticatorsResponse,
  DeleteAuthenticatorResponse,
  GenerateAuthenticatorRegistrationOptionsResponse,
  VerifyAuthenticatorRegistrationResponseResponse,
  GenerateAuthenticatorAuthenticationOptionsResponse,
} from '../../Response'

export interface AuthenticatorServerInterface {
  list(params: ListAuthenticatorsRequestParams): Promise<ListAuthenticatorsResponse>
  delete(params: DeleteAuthenticatorRequestParams): Promise<DeleteAuthenticatorResponse>
  generateRegistrationOptions(): Promise<GenerateAuthenticatorRegistrationOptionsResponse>
  verifyRegistrationResponse(
    params: VerifyAuthenticatorRegistrationResponseRequestParams,
  ): Promise<VerifyAuthenticatorRegistrationResponseResponse>
  generateAuthenticationOptions(
    params: GenerateAuthenticatorAuthenticationOptionsRequestParams,
  ): Promise<GenerateAuthenticatorAuthenticationOptionsResponse>
}
