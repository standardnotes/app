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
  isUserGroupAdmin(vaultSystemIdentifier: string): boolean

  inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContact,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError>
  removeUserFromGroup(vaultSystemIdentifier: string, userUuid: string): Promise<ClientDisplayableError | void>
  leaveGroup(vaultSystemIdentifier: string): Promise<ClientDisplayableError | void>
  getGroupUsers(vaultSystemIdentifier: string): Promise<GroupUserServerHash[] | undefined>
  isGroupUserOwnUser(user: GroupUserServerHash): boolean

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
  reloadRemovedVaults(): Promise<void>

  updateInvitesAfterVaultKeyChange(params: {
    vaultSystemIdentifier: string
    groupUuid: string
  }): Promise<ClientDisplayableError[]>
}
