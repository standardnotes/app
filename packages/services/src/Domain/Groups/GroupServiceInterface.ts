import {
  ClientDisplayableError,
  GroupServerHash,
  GroupInviteServerHash,
  GroupUserServerHash,
  GroupPermission,
} from '@standardnotes/responses'
import { TrustedContact, DecryptedItemInterface, GroupKeyInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'

export enum GroupServiceEvent {
  DidResolveRemoteGroupInvites = 'DidResolveRemoteGroupInvites',
}

export interface GroupServiceInterface extends AbstractService<GroupServiceEvent> {
  createGroup(name?: string, description?: string): Promise<GroupServerHash | ClientDisplayableError>

  reloadGroups(): Promise<GroupServerHash[] | ClientDisplayableError>

  getGroups(): GroupServerHash[]

  getGroupKey(groupUuid: string): GroupKeyInterface | undefined

  inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContact,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError>

  addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  removeItemFromItsGroup(item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  removeItemFromItsGroup(item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  deleteGroup(groupUuid: string): Promise<boolean>

  removeUserFromGroup(groupUuid: string, userUuid: string): Promise<ClientDisplayableError | void>

  downloadInboundInvites(): Promise<ClientDisplayableError | GroupInviteServerHash[]>

  getOutboundInvites(): Promise<GroupInviteServerHash[] | ClientDisplayableError>

  isInviteTrusted(invite: GroupInviteServerHash): boolean

  acceptInvite(invite: GroupInviteServerHash): Promise<boolean>

  getPendingInvites(): GroupInviteServerHash[]

  getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined>

  rotateGroupKey(groupUuid: string): Promise<void>
}
