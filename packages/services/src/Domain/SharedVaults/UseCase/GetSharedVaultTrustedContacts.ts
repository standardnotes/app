import { SharedVaultUsersServerInterface } from '@standardnotes/api'
import { GetSharedVaultUsersUseCase } from './GetSharedVaultUsers'
import { SharedVaultListingInterface, TrustedContactInterface } from '@standardnotes/models'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { isNotUndefined } from '@standardnotes/utils'

export class GetSharedVaultTrustedContacts {
  constructor(
    private contacts: ContactServiceInterface,
    private sharedVaultUsersServer: SharedVaultUsersServerInterface,
  ) {}

  async execute(vault: SharedVaultListingInterface): Promise<TrustedContactInterface[] | undefined> {
    const useCase = new GetSharedVaultUsersUseCase(this.sharedVaultUsersServer)
    const users = await useCase.execute({ sharedVaultUuid: vault.sharing.sharedVaultUuid })
    if (!users) {
      return undefined
    }

    const contacts = users.map((user) => this.contacts.findTrustedContact(user.user_uuid)).filter(isNotUndefined)
    return contacts
  }
}
