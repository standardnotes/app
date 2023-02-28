import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import {
  ListAuthenticatorsRequestParams,
  GenerateAuthenticatorAuthenticationOptionsRequestParams,
  DeleteAuthenticatorRequestParams,
  VerifyAuthenticatorRegistrationResponseRequestParams,
} from '../../Request'
import { HttpResponse } from '@standardnotes/responses'
import {
  ListAuthenticatorsResponseBody,
  DeleteAuthenticatorResponseBody,
  GenerateAuthenticatorRegistrationOptionsResponseBody,
  VerifyAuthenticatorRegistrationResponseBody,
  GenerateAuthenticatorAuthenticationOptionsResponseBody,
} from '../../Response'
import { AuthenticatorServerInterface } from './AuthenticatorServerInterface'
import { Paths } from './Paths'

export class AuthenticatorServer implements AuthenticatorServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async list(params: ListAuthenticatorsRequestParams): Promise<HttpResponse<ListAuthenticatorsResponseBody>> {
    return this.httpService.get(Paths.v1.listAuthenticators, params)
  }

  async delete(params: DeleteAuthenticatorRequestParams): Promise<HttpResponse<DeleteAuthenticatorResponseBody>> {
    return this.httpService.delete(Paths.v1.deleteAuthenticator(params.authenticatorId), params)
  }

  async generateRegistrationOptions(): Promise<HttpResponse<GenerateAuthenticatorRegistrationOptionsResponseBody>> {
    return this.httpService.get(Paths.v1.generateRegistrationOptions)
  }

  async verifyRegistrationResponse(
    params: VerifyAuthenticatorRegistrationResponseRequestParams,
  ): Promise<HttpResponse<VerifyAuthenticatorRegistrationResponseBody>> {
    return this.httpService.post(Paths.v1.verifyRegistrationResponse, params)
  }

  async generateAuthenticationOptions(
    params: GenerateAuthenticatorAuthenticationOptionsRequestParams,
  ): Promise<HttpResponse<GenerateAuthenticatorAuthenticationOptionsResponseBody>> {
    return this.httpService.post(Paths.v1.generateAuthenticationOptions, params)
  }
}
