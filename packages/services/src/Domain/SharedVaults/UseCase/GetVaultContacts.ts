import { GetSharedVaultUsers } from './GetSharedVaultUsers'
import { TrustedContactInterface } from '@standardnotes/models'
import { isNotUndefined } from '@standardnotes/utils'
import { FindContact } from '../../Contacts/UseCase/FindContact'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class GetVaultContacts implements UseCaseInterface<TrustedContactInterface[]> {
  constructor(private findContact: FindContact, private getVaultUsers: GetSharedVaultUsers) {}

  async execute(sharedVaultUuid: string): Promise<Result<TrustedContactInterface[]>> {
    const users = await this.getVaultUsers.execute({ sharedVaultUuid })
    if (!users) {
      return Result.fail('Failed to get vault users')
    }

    const contacts = users
      .map((user) => this.findContact.execute({ userUuid: user.user_uuid }))
      .map((result) => (result.isFailed() ? undefined : result.getValue()))
      .filter(isNotUndefined)

    return Result.ok(contacts)
  }
}
