import { AuthenticatorClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Username } from '@standardnotes/domain-core'

import { GetAuthenticatorAuthenticationOptionsDTO } from './GetAuthenticatorAuthenticationOptionsDTO'

export class GetAuthenticatorAuthenticationOptions implements UseCaseInterface<Record<string, unknown>> {
  constructor(private authenticatorClient: AuthenticatorClientInterface) {}

  async execute(dto: GetAuthenticatorAuthenticationOptionsDTO): Promise<Result<Record<string, unknown>>> {
    const usernameOrError = Username.create(dto.username)
    if (usernameOrError.isFailed()) {
      return Result.fail(`Could not generate authenticator authentication options: ${usernameOrError.getError()}`)
    }
    const username = usernameOrError.getValue()

    const authenticationOptions = await this.authenticatorClient.generateAuthenticationOptions(username)
    if (authenticationOptions === null) {
      return Result.fail('Could not generate authenticator authentication options')
    }

    return Result.ok(authenticationOptions)
  }
}
