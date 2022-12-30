import { AuthenticatorClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Username, Uuid } from '@standardnotes/domain-core'

import { RegisterAuthenticatorDTO } from './RegisterAuthenticatorDTO'

export class RegisterAuthenticator implements UseCaseInterface<boolean> {
  constructor(
    private authenticatorManager: AuthenticatorClientInterface,
    private registrationPromptFunction: (
      publicKeyCredentialCreationOptions: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>,
  ) {}

  async execute(dto: RegisterAuthenticatorDTO): Promise<Result<boolean>> {
    const userUuidOrError = Uuid.create(dto.userUuid)
    if (userUuidOrError.isFailed()) {
      return Result.fail(`Could not register authenticator: ${userUuidOrError.getError()}`)
    }
    const userUuid = userUuidOrError.getValue()

    const usernameOrError = Username.create(dto.username)
    if (usernameOrError.isFailed()) {
      return Result.fail(`Could not register authenticator: ${usernameOrError.getError()}`)
    }
    const username = usernameOrError.getValue()

    const regisrationOptions = await this.authenticatorManager.generateRegistrationOptions(userUuid, username)

    if (regisrationOptions === null) {
      return Result.fail('Could not register authenticator: registration options are not generated.')
    }

    let attestationResponse: Record<string, unknown>
    try {
      attestationResponse = await this.registrationPromptFunction(regisrationOptions)
    } catch (error) {
      if ((error as Error).name === 'InvalidStateError') {
        return Result.fail('Could not register authenticator: already registered.')
      } else {
        return Result.fail(`Could not register authenticator: ${(error as Error).message}`)
      }
    }

    const responseVerified = await this.authenticatorManager.verifyRegistrationResponse(
      userUuid,
      dto.authenticatorName,
      attestationResponse,
    )

    if (!responseVerified) {
      return Result.fail('Could not register authenticator: registration response is not verified.')
    }

    return Result.ok(true)
  }
}
