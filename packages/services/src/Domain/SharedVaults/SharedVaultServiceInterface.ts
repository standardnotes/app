import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultUserServerHash,
  SharedVaultPermission,
} from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  TrustedContactInterface,
  SharedVaultDisplayListing,
  VaultDisplayListing,
  AsymmetricMessagePayload,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'
import { PendingSharedVaultInviteRecord } from './PendingSharedVaultInviteRecord'

export interface SharedVaultServiceInterface
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload> {
  createSharedVault(name: string, description?: string): Promise<VaultDisplayListing | ClientDisplayableError>
  deleteSharedVault(sharedVault: SharedVaultDisplayListing): Promise<ClientDisplayableError | void>

  inviteContactToSharedVault(
    sharedVault: SharedVaultDisplayListing,
    contact: TrustedContactInterface,
    permissions: SharedVaultPermission,
  ): Promise<SharedVaultInviteServerHash | ClientDisplayableError>
  removeUserFromSharedVault(
    sharedVault: SharedVaultDisplayListing,
    userUuid: string,
  ): Promise<ClientDisplayableError | void>
  leaveSharedVault(sharedVault: SharedVaultDisplayListing): Promise<ClientDisplayableError | void>
  getSharedVaultUsers(sharedVault: SharedVaultDisplayListing): Promise<SharedVaultUserServerHash[] | undefined>
  isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean
  isCurrentUserSharedVaultAdmin(sharedVault: SharedVaultDisplayListing): boolean

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined

  downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]>
  getOutboundInvites(vaultUuid?: string): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError>
  isInviteTrusted(invite: SharedVaultInviteServerHash): Promise<boolean>
  acceptPendingSharedVaultInvite(pendingInvite: PendingSharedVaultInviteRecord): Promise<void>
  getInviteDataMessageAndTrustStatus(
    invite: SharedVaultInviteServerHash,
  ): { trusted: boolean; message: AsymmetricMessagePayload } | undefined
  getCachedPendingInvites(): PendingSharedVaultInviteRecord[]
  getInvitableContactsForSharedVault(sharedVault: SharedVaultDisplayListing): Promise<TrustedContactInterface[]>
  deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void>
}
