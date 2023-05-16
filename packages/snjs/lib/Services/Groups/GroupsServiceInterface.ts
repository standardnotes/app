import { ClientDisplayableError } from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { GroupInterface, GroupPermission, GroupUserServerHash } from '@standardnotes/api'
import { Contact, DecryptedItemInterface } from '@standardnotes/models'

export enum GroupsServiceEvent {}

export interface GroupsServiceInterface extends AbstractService<GroupsServiceEvent> {
  createGroup(): Promise<GroupInterface | ClientDisplayableError>

  addContactToGroup(
    group: GroupInterface,
    contact: Contact,
    permissions: GroupPermission,
  ): Promise<GroupUserServerHash | ClientDisplayableError>

  addItemToGroup(group: GroupInterface, item: DecryptedItemInterface): Promise<void>
}
