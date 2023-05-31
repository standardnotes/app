import {
  ClientDisplayableError,
  VaultInviteServerHash,
  VaultUserServerHash,
  VaultPermission,
} from '@standardnotes/responses'
import {
  TrustedContact,
  DecryptedItemInterface,
  VaultKeyContentSpecialized,
  TrustedContactInterface,
  VaultInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultCollaborationServiceEvent, VaultCollaborationServiceEventPayload } from './VaultCollaborationServiceEvent'

export interface VaultCollaborationServiceInterface
  extends AbstractService<VaultCollaborationServiceEvent, VaultCollaborationServiceEventPayload> {
  isUserVaultAdmin(vaultUuid: string): boolean

  inviteContactToVault(
    vault: VaultInterface,
    contact: TrustedContact,
    permissions: VaultPermission,
  ): Promise<VaultInviteServerHash | ClientDisplayableError>
  removeUserFromVault(vaultUuid: string, userUuid: string): Promise<ClientDisplayableError | void>
  leaveVault(vaultUuid: string): Promise<ClientDisplayableError | void>
  getVaultUsers(vaultUuid: string): Promise<VaultUserServerHash[] | undefined>
  isVaultUserOwnUser(user: VaultUserServerHash): boolean

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined

  downloadInboundInvites(): Promise<ClientDisplayableError | VaultInviteServerHash[]>
  getOutboundInvites(vaultUuid?: string): Promise<VaultInviteServerHash[] | ClientDisplayableError>
  getTrustedSenderOfInvite(invite: VaultInviteServerHash): TrustedContactInterface | undefined
  acceptInvite(invite: VaultInviteServerHash): Promise<boolean>
  getInviteData(invite: VaultInviteServerHash): VaultKeyContentSpecialized | undefined
  getCachedInboundInvites(): VaultInviteServerHash[]
  getInvitableContactsForVault(vault: VaultInterface): Promise<TrustedContactInterface[]>
  deleteInvite(invite: VaultInviteServerHash): Promise<ClientDisplayableError | void>
  reloadRemovedVaults(): Promise<void>

  updateInvitesAfterVaultDataChange(vaultUuid: string): Promise<ClientDisplayableError[]>
}
