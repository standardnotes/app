import { ClientDisplayableError, GroupServerHash, GroupUserKeyServerHash } from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { GroupPermission } from '@standardnotes/api'
import { Contact, DecryptedItemInterface } from '@standardnotes/models'

export enum GroupServiceEvent {}

export interface GroupServiceInterface extends AbstractService<GroupServiceEvent> {
  createGroup(): Promise<GroupServerHash | ClientDisplayableError>

  addContactToGroup(
    group: GroupServerHash,
    contact: Contact,
    permissions: GroupPermission,
  ): Promise<GroupUserKeyServerHash | ClientDisplayableError>

  addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
}
