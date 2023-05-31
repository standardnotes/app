import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { VaultUsersServerInterface } from '@standardnotes/api'

export class RemoveVaultMemberUseCase {
  constructor(private vaultUserServer: VaultUsersServerInterface) {}

  async execute(params: { vaultUuid: string; userUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultUserServer.deleteVaultUser({
      vaultUuid: params.vaultUuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to remove vault user ${response}`)
    }
  }
}
