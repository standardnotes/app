import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { GetAuthenticatorAuthenticationResponseDTO } from './GetAuthenticatorAuthenticationResponseDTO'
import { GetAuthenticatorAuthenticationOptions } from '../GetAuthenticatorAuthenticationOptions/GetAuthenticatorAuthenticationOptions'

export class GetAuthenticatorAuthenticationResponse implements UseCaseInterface<Record<string, unknown>> {
  constructor(
    private getAuthenticatorAuthenticationOptions: GetAuthenticatorAuthenticationOptions,
    private authenticatorVerificationPromptFunction?: (
      authenticationOptions: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>,
  ) {}

  async execute(dto: GetAuthenticatorAuthenticationResponseDTO): Promise<Result<Record<string, unknown>>> {
    if (!this.authenticatorVerificationPromptFunction) {
      return Result.fail(
        'Could not generate authenticator authentication options: No authenticator verification prompt function provided',
      )
    }

    const authenticationOptionsOrError = await this.getAuthenticatorAuthenticationOptions.execute({
      username: dto.username,
    })
    if (authenticationOptionsOrError.isFailed()) {
      return Result.fail(authenticationOptionsOrError.getError())
    }
    const authenticationOptions = authenticationOptionsOrError.getValue()

    let authenticatorResponse
    try {
      authenticatorResponse = await this.authenticatorVerificationPromptFunction(authenticationOptions)
    } catch (error) {
      return Result.fail(`Could not generate authenticator authentication options: ${(error as Error).message}`)
    }

    return Result.ok(authenticatorResponse)
  }
}
