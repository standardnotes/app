import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupUserServerHash,
  GroupPermission,
  GroupServerHash,
} from '@standardnotes/responses'
import {
  TrustedContact,
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { GroupServiceEvent, GroupServiceEventPayload } from './GroupServiceEvent'

export interface GroupServiceInterface extends AbstractService<GroupServiceEvent, GroupServiceEventPayload> {
  createGroup(params: { vaultSystemIdentifier: string }): Promise<GroupServerHash | ClientDisplayableError>

  inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContact,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError>
  removeUserFromGroup(groupUuid: string, userUuid: string): Promise<ClientDisplayableError | void>
  leaveGroup(groupUuid: string): Promise<ClientDisplayableError | void>
  getGroupUsers(vaultSystemIdentifier: string): Promise<GroupUserServerHash[] | undefined>
  isGroupUserGroupOwner(user: GroupUserServerHash): boolean
  isCurrentUserGroupAdmin(groupUuid: string, userUuid: string): boolean

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined

  downloadInboundInvites(): Promise<ClientDisplayableError | GroupInviteServerHash[]>
  getOutboundInvites(vaultUuid?: string): Promise<GroupInviteServerHash[] | ClientDisplayableError>
  getTrustedSenderOfInvite(invite: GroupInviteServerHash): TrustedContactInterface | undefined
  acceptInvite(invite: GroupInviteServerHash): Promise<boolean>
  getInviteData(invite: GroupInviteServerHash): VaultKeyCopyContentSpecialized | undefined
  getCachedInboundInvites(): GroupInviteServerHash[]
  getInvitableContactsForGroup(groupUuid: string): Promise<TrustedContactInterface[]>
  deleteInvite(invite: GroupInviteServerHash): Promise<ClientDisplayableError | void>
  reloadRemovedGroups(): Promise<void>

  updateInvitesAfterVaultKeyChange(params: {
    vaultSystemIdentifier: string
    groupUuid: string
  }): Promise<ClientDisplayableError[]>
}
