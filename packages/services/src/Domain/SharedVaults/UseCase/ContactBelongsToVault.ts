import { GetVaultUsers } from './../../VaultUser/UseCase/GetVaultUsers'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultListingInterface, TrustedContactInterface } from '@standardnotes/models'

export class ContactBelongsToVault implements UseCaseInterface<boolean> {
  constructor(private getVaultUsers: GetVaultUsers) {}

  async execute(dto: {
    contact: TrustedContactInterface
    vault: SharedVaultListingInterface
  }): Promise<Result<boolean>> {
    const users = await this.getVaultUsers.execute({
      sharedVaultUuid: dto.vault.sharing.sharedVaultUuid,
      readFromCache: false,
    })

    if (users.isFailed()) {
      return Result.fail('Failed to get vault users')
    }

    return Result.ok(users.getValue().some((u) => u.user_uuid === dto.contact.contactUuid))
  }
}
