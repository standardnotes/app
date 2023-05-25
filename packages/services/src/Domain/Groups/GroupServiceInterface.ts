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

  inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContact,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError>
  removeUserFromGroup(groupUuid: string, userUuid: string): Promise<ClientDisplayableError | void>
  getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined>

  addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromItsGroup(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromItsGroup(item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  downloadInboundInvites(): Promise<ClientDisplayableError | GroupInviteServerHash[]>
  getOutboundInvites(): Promise<GroupInviteServerHash[] | ClientDisplayableError>
  isInviteTrusted(invite: GroupInviteServerHash): boolean
  acceptInvite(invite: GroupInviteServerHash): Promise<boolean>
  getPendingInvites(): GroupInviteServerHash[]

  rotateGroupKey(groupUuid: string): Promise<void>
  changeGroupMetadata(
    groupUuid: string,
    params: { name: string; description: string },
  ): Promise<ClientDisplayableError[] | undefined>
}
