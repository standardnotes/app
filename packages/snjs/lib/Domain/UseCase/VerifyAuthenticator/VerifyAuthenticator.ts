import { AuthenticatorClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Uuid } from '@standardnotes/domain-core'

import { VerifyAuthenticatorDTO } from './VerifyAuthenticatorDTO'

export class VerifyAuthenticator implements UseCaseInterface<void> {
  constructor(
    private authenticatorClient: AuthenticatorClientInterface,
    private authenticatorVerificationPromptFunction?: (
      authenticationOptions: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>,
  ) {}

  async execute(dto: VerifyAuthenticatorDTO): Promise<Result<void>> {
    if (!this.authenticatorVerificationPromptFunction) {
      return Result.fail(
        'Could not generate authenticator authentication options: No authenticator verification prompt function provided',
      )
    }

    const userUuidOrError = Uuid.create(dto.userUuid)
    if (userUuidOrError.isFailed()) {
      return Result.fail(`Could not generate authenticator authentication options: ${userUuidOrError.getError()}`)
    }
    const userUuid = userUuidOrError.getValue()

    const authenticationOptions = await this.authenticatorClient.generateAuthenticationOptions()
    if (authenticationOptions === null) {
      return Result.fail('Could not generate authenticator authentication options')
    }

    let authenticatorResponse
    try {
      authenticatorResponse = await this.authenticatorVerificationPromptFunction(authenticationOptions)
    } catch (error) {
      return Result.fail(`Could not generate authenticator authentication options: ${(error as Error).message}`)
    }

    const verificationResponse = await this.authenticatorClient.verifyAuthenticationResponse(
      userUuid,
      authenticatorResponse,
    )
    if (!verificationResponse) {
      return Result.fail('Could not generate authenticator authentication options')
    }

    return Result.ok()
  }
}
