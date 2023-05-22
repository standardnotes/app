import {
  ClientDisplayableError,
  GroupServerHash,
  GroupInviteServerHash,
  GroupUserServerHash,
  GroupPermission,
} from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { TrustedContact, DecryptedItemInterface, GroupKeyInterface } from '@standardnotes/models'

export enum GroupServiceEvent {
  DidResolveRemoteGroupInvites = 'DidResolveRemoteGroupInvites',
}

export interface GroupServiceInterface extends AbstractService<GroupServiceEvent> {
  createGroup(): Promise<GroupServerHash | ClientDisplayableError>

  inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContact,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError>

  addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  deleteGroup(groupUuid: string): Promise<boolean>

  removeUserFromGroup(groupUuid: string, userUuid: string): Promise<boolean>

  getInboundInvites(): Promise<
    | {
        trusted: GroupInviteServerHash[]
        untrusted: GroupInviteServerHash[]
      }
    | ClientDisplayableError
  >

  acceptInvites(
    invites: GroupInviteServerHash[],
  ): Promise<{ inserted: GroupKeyInterface[]; changed: GroupKeyInterface[]; errored: GroupInviteServerHash[] }>

  getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined>

  rotateGroupKey(groupUuid: string): Promise<void>
}
