import { HttpResponse } from '@standardnotes/responses'
import {
  ListAuthenticatorsResponseBody,
  DeleteAuthenticatorResponseBody,
  GenerateAuthenticatorRegistrationOptionsResponseBody,
  VerifyAuthenticatorRegistrationResponseBody,
  GenerateAuthenticatorAuthenticationOptionsResponseBody,
} from '../../Response'

export interface AuthenticatorApiServiceInterface {
  list(): Promise<HttpResponse<ListAuthenticatorsResponseBody>>
  delete(authenticatorId: string): Promise<HttpResponse<DeleteAuthenticatorResponseBody>>
  generateRegistrationOptions(): Promise<HttpResponse<GenerateAuthenticatorRegistrationOptionsResponseBody>>
  verifyRegistrationResponse(
    userUuid: string,
    name: string,
    attestationResponse: Record<string, unknown>,
  ): Promise<HttpResponse<VerifyAuthenticatorRegistrationResponseBody>>
  generateAuthenticationOptions(
    username: string,
  ): Promise<HttpResponse<GenerateAuthenticatorAuthenticationOptionsResponseBody>>
}
