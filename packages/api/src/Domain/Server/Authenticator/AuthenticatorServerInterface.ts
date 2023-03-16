import { HttpResponse } from '@standardnotes/responses'
import {
  ListAuthenticatorsRequestParams,
  DeleteAuthenticatorRequestParams,
  VerifyAuthenticatorRegistrationResponseRequestParams,
  GenerateAuthenticatorAuthenticationOptionsRequestParams,
} from '../../Request'
import {
  ListAuthenticatorsResponseBody,
  DeleteAuthenticatorResponseBody,
  GenerateAuthenticatorRegistrationOptionsResponseBody,
  VerifyAuthenticatorRegistrationResponseBody,
  GenerateAuthenticatorAuthenticationOptionsResponseBody,
} from '../../Response'

export interface AuthenticatorServerInterface {
  list(params: ListAuthenticatorsRequestParams): Promise<HttpResponse<ListAuthenticatorsResponseBody>>
  delete(params: DeleteAuthenticatorRequestParams): Promise<HttpResponse<DeleteAuthenticatorResponseBody>>
  generateRegistrationOptions(): Promise<HttpResponse<GenerateAuthenticatorRegistrationOptionsResponseBody>>
  verifyRegistrationResponse(
    params: VerifyAuthenticatorRegistrationResponseRequestParams,
  ): Promise<HttpResponse<VerifyAuthenticatorRegistrationResponseBody>>
  generateAuthenticationOptions(
    params: GenerateAuthenticatorAuthenticationOptionsRequestParams,
  ): Promise<HttpResponse<GenerateAuthenticatorAuthenticationOptionsResponseBody>>
}
