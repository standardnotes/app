import { AuthenticatorClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Uuid } from '@standardnotes/domain-core'

import { DeleteAuthenticatorDTO } from './DeleteAuthenticatorDTO'

export class DeleteAuthenticator implements UseCaseInterface<void> {
  constructor(private authenticatorClient: AuthenticatorClientInterface) {}

  async execute(dto: DeleteAuthenticatorDTO): Promise<Result<void>> {
    const authenticatorIdOrError = Uuid.create(dto.authenticatorId)
    if (authenticatorIdOrError.isFailed()) {
      return Result.fail(`Could not delete authenticator: ${authenticatorIdOrError.getError()}`)
    }
    const authenticatorId = authenticatorIdOrError.getValue()

    const result = await this.authenticatorClient.delete(authenticatorId)
    if (!result) {
      return Result.fail('Could not delete authenticator')
    }

    return Result.ok()
  }
}
