import { AuthenticatorClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class ListAuthenticators implements UseCaseInterface<Array<{ id: string; name: string }>> {
  constructor(private authenticatorClient: AuthenticatorClientInterface) {}

  async execute(): Promise<Result<Array<{ id: string; name: string }>>> {
    const authenticators = await this.authenticatorClient.list()

    return Result.ok(authenticators)
  }
}
