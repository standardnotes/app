import {
  ClientDisplayableError,
  GroupServerHash,
  GroupUserKeyServerHash,
  GroupUserListingServerHash,
} from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { GroupPermission } from '@standardnotes/api'
import { Contact, DecryptedItemInterface } from '@standardnotes/models'

export enum GroupServiceEvent {
  DidResolveRemoteGroupUserKeys = 'DidResolveRemoteGroupUserKeys',
}

export interface GroupServiceInterface extends AbstractService<GroupServiceEvent> {
  createGroup(): Promise<GroupServerHash | ClientDisplayableError>

  addContactToGroup(
    group: GroupServerHash,
    contact: Contact,
    permissions: GroupPermission,
  ): Promise<GroupUserKeyServerHash | ClientDisplayableError>

  addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  deleteGroup(groupUuid: string): Promise<boolean>

  removeUserFromGroup(groupUuid: string, userUuid: string): Promise<boolean>

  getGroupUsers(groupUuid: string): Promise<GroupUserListingServerHash[] | undefined>

  rotateGroupKey(groupUuid: string): Promise<void>
}
