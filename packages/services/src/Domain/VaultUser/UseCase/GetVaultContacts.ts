import { GetVaultUsers } from './GetVaultUsers'
import { TrustedContactInterface } from '@standardnotes/models'
import { isNotUndefined } from '@standardnotes/utils'
import { FindContact } from '../../Contacts/UseCase/FindContact'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class GetVaultContacts implements UseCaseInterface<TrustedContactInterface[]> {
  constructor(
    private _findContact: FindContact,
    private _getVaultUsers: GetVaultUsers,
  ) {}

  async execute(dto: { sharedVaultUuid: string; readFromCache: boolean }): Promise<Result<TrustedContactInterface[]>> {
    const users = await this._getVaultUsers.execute({
      sharedVaultUuid: dto.sharedVaultUuid,
      readFromCache: dto.readFromCache,
    })
    if (users.isFailed()) {
      return Result.fail('Failed to get vault users')
    }

    const contacts = users
      .getValue()
      .map((user) => this._findContact.execute({ userUuid: user.user_uuid }))
      .map((result) => (result.isFailed() ? undefined : result.getValue()))
      .filter(isNotUndefined)

    return Result.ok(contacts)
  }
}
