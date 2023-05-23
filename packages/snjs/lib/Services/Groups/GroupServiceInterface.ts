import {
  ClientDisplayableError,
  GroupServerHash,
  GroupInviteServerHash,
  GroupUserServerHash,
  GroupPermission,
} from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { TrustedContact, DecryptedItemInterface } from '@standardnotes/models'

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

  removeUserFromGroup(groupUuid: string, userUuid: string): Promise<ClientDisplayableError | void>

  downloadInboundInvites(): Promise<ClientDisplayableError | void>

  getOutboundInvites(): Promise<GroupInviteServerHash[] | ClientDisplayableError>

  acceptInvite(invite: GroupInviteServerHash): Promise<boolean>

  getPendingInvites(): GroupInviteServerHash[]

  getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined>

  rotateGroupKey(groupUuid: string): Promise<void>
}
