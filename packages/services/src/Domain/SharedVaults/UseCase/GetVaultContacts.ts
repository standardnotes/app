import { GetSharedVaultUsers } from './GetSharedVaultUsers'
import { TrustedContactInterface } from '@standardnotes/models'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { isNotUndefined } from '@standardnotes/utils'

export class GetVaultContacts {
  constructor(private contacts: ContactServiceInterface, private getVaultUsers: GetSharedVaultUsers) {}

  async execute(sharedVaultUuid: string): Promise<TrustedContactInterface[] | undefined> {
    const users = await this.getVaultUsers.execute({ sharedVaultUuid })
    if (!users) {
      return undefined
    }

    const contacts = users.map((user) => this.contacts.findTrustedContact(user.user_uuid)).filter(isNotUndefined)
    return contacts
  }
}
