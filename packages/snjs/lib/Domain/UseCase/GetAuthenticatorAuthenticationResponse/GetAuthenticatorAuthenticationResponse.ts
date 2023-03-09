import { AuthenticatorClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Username } from '@standardnotes/domain-core'
import { GetAuthenticatorAuthenticationResponseDTO } from './GetAuthenticatorAuthenticationResponseDTO'

export class GetAuthenticatorAuthenticationResponse implements UseCaseInterface<Record<string, unknown>> {
  constructor(
    private authenticatorClient: AuthenticatorClientInterface,
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

    const usernameOrError = Username.create(dto.username)
    if (usernameOrError.isFailed()) {
      return Result.fail(`Could not generate authenticator authentication options: ${usernameOrError.getError()}`)
    }
    const username = usernameOrError.getValue()

    const authenticationOptions = await this.authenticatorClient.generateAuthenticationOptions(username)
    if (authenticationOptions === null) {
      return Result.fail('Could not generate authenticator authentication options')
    }

    let authenticatorResponse
    try {
      authenticatorResponse = await this.authenticatorVerificationPromptFunction(authenticationOptions)
    } catch (error) {
      console.error(error)

      return Result.fail(`Could not generate authenticator authentication options: ${(error as Error).message}`)
    }

    return Result.ok(authenticatorResponse)
  }
}
