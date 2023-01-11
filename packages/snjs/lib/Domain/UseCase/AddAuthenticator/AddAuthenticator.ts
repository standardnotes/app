import { AuthenticatorClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Uuid, Validator } from '@standardnotes/domain-core'

import { AddAuthenticatorDTO } from './AddAuthenticatorDTO'

export class AddAuthenticator implements UseCaseInterface<void> {
  constructor(
    private authenticatorClient: AuthenticatorClientInterface,
    private authenticatorRegistrationPromptFunction?: (
      registrationOptions: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>,
  ) {}

  async execute(dto: AddAuthenticatorDTO): Promise<Result<void>> {
    if (!this.authenticatorRegistrationPromptFunction) {
      return Result.fail(
        'Could not generate authenticator registration options: No authenticator registration prompt function provided',
      )
    }

    const userUuidOrError = Uuid.create(dto.userUuid)
    if (userUuidOrError.isFailed()) {
      return Result.fail(`Could not generate authenticator registration options: ${userUuidOrError.getError()}`)
    }
    const userUuid = userUuidOrError.getValue()

    const authenticatorNameValidatorResult = Validator.isNotEmpty(dto.authenticatorName)
    if (authenticatorNameValidatorResult.isFailed()) {
      return Result.fail(
        `Could not generate authenticator registration options: ${authenticatorNameValidatorResult.getError()}`,
      )
    }

    const registrationOptions = await this.authenticatorClient.generateRegistrationOptions()
    if (registrationOptions === null) {
      return Result.fail('Could not generate authenticator registration options')
    }

    let authenticatorResponse
    try {
      authenticatorResponse = await this.authenticatorRegistrationPromptFunction(registrationOptions)
    } catch (error) {
      if ((error as Error).name === 'InvalidStateError') {
        return Result.fail('Authenticator was probably already registered by user')
      } else {
        return Result.fail(`Could not generate authenticator registration options: ${(error as Error).message}`)
      }
    }

    const verificationResponse = await this.authenticatorClient.verifyRegistrationResponse(
      userUuid,
      dto.authenticatorName,
      authenticatorResponse,
    )
    if (!verificationResponse) {
      return Result.fail('Could not verify authenticator registration response')
    }

    return Result.ok()
  }
}
