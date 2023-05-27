import {
  ClientDisplayableError,
  GroupServerHash,
  GroupInviteServerHash,
  GroupUserServerHash,
  GroupPermission,
} from '@standardnotes/responses'
import {
  TrustedContact,
  DecryptedItemInterface,
  GroupKeyInterface,
  GroupKeyContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { GroupServiceEvent } from './GroupServiceEvent'

export interface GroupServiceInterface extends AbstractService<GroupServiceEvent> {
  createGroup(name?: string, description?: string): Promise<GroupServerHash | ClientDisplayableError>
  reloadGroups(): Promise<GroupServerHash[] | ClientDisplayableError>
  getGroups(): GroupServerHash[]
  deleteGroup(groupUuid: string): Promise<boolean>

  getGroupKey(groupUuid: string): GroupKeyInterface | undefined
  getGroupInfoForItem(item: DecryptedItemInterface): GroupKeyContentSpecialized | undefined
  getGroupInfo(groupUuid: string): GroupKeyContentSpecialized | undefined
  isUserGroupAdmin(groupUuid: string): boolean

  inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContact,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError>
  removeUserFromGroup(groupUuid: string, userUuid: string): Promise<ClientDisplayableError | void>
  leaveGroup(groupUuid: string): Promise<ClientDisplayableError | void>
  getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined>
  isGroupUserOwnUser(user: GroupUserServerHash): boolean

  addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromItsGroup(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromItsGroup(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  isItemInCollaborativeGroup(item: DecryptedItemInterface): boolean

  downloadInboundInvites(): Promise<ClientDisplayableError | GroupInviteServerHash[]>
  getOutboundInvites(groupUuid?: string): Promise<GroupInviteServerHash[] | ClientDisplayableError>
  getTrustedSenderOfInvite(invite: GroupInviteServerHash): TrustedContactInterface | undefined
  acceptInvite(invite: GroupInviteServerHash): Promise<boolean>
  getInviteData(invite: GroupInviteServerHash): GroupKeyContentSpecialized | undefined
  getCachedInboundInvites(): GroupInviteServerHash[]
  getInvitableContactsForGroup(group: GroupServerHash): Promise<TrustedContactInterface[]>
  deleteInvite(invite: GroupInviteServerHash): Promise<ClientDisplayableError | void>

  rotateGroupKey(groupUuid: string): Promise<void>
  changeGroupMetadata(
    groupUuid: string,
    params: { name: string; description: string },
  ): Promise<ClientDisplayableError[] | undefined>
}
