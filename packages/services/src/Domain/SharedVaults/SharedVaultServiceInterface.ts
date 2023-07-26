import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultUserServerHash,
  SharedVaultPermission,
} from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  TrustedContactInterface,
  SharedVaultListingInterface,
  VaultListingInterface,
  KeySystemRootKeyStorageMode,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'
import { PendingSharedVaultInviteRecord } from './PendingSharedVaultInviteRecord'

export interface SharedVaultServiceInterface
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload> {
  createSharedVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string | undefined
    storagePreference?: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface | ClientDisplayableError>
  deleteSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void>

  convertVaultToSharedVault(vault: VaultListingInterface): Promise<SharedVaultListingInterface | ClientDisplayableError>

  inviteContactToSharedVault(
    sharedVault: SharedVaultListingInterface,
    contact: TrustedContactInterface,
    permission: SharedVaultPermission,
  ): Promise<SharedVaultInviteServerHash | ClientDisplayableError>
  removeUserFromSharedVault(
    sharedVault: SharedVaultListingInterface,
    userUuid: string,
  ): Promise<ClientDisplayableError | void>
  leaveSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void>
  getSharedVaultUsers(sharedVault: SharedVaultListingInterface): Promise<SharedVaultUserServerHash[] | undefined>
  isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean
  isCurrentUserSharedVaultAdmin(sharedVault: SharedVaultListingInterface): boolean

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined

  downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]>
  getOutboundInvites(
    sharedVault?: SharedVaultListingInterface,
  ): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError>
  acceptPendingSharedVaultInvite(pendingInvite: PendingSharedVaultInviteRecord): Promise<void>
  getCachedPendingInviteRecords(): PendingSharedVaultInviteRecord[]
  getInvitableContactsForSharedVault(sharedVault: SharedVaultListingInterface): Promise<TrustedContactInterface[]>
  deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void>
}
