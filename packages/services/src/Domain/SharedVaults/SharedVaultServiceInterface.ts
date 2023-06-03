import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultUserServerHash,
  SharedVaultPermission,
  SharedVaultServerHash,
} from '@standardnotes/responses'
import {
  TrustedContact,
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'

export interface SharedVaultServiceInterface
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload> {
  createSharedVault(params: { keySystemIdentifier: string }): Promise<SharedVaultServerHash | ClientDisplayableError>

  inviteContactToSharedVault(
    sharedVault: SharedVaultServerHash,
    contact: TrustedContact,
    permissions: SharedVaultPermission,
  ): Promise<SharedVaultInviteServerHash | ClientDisplayableError>
  removeUserFromSharedVault(sharedVaultUuid: string, userUuid: string): Promise<ClientDisplayableError | void>
  leaveSharedVault(sharedVaultUuid: string): Promise<ClientDisplayableError | void>
  getSharedVaultUsers(keySystemIdentifier: string): Promise<SharedVaultUserServerHash[] | undefined>
  isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean
  isCurrentUserSharedVaultAdmin(sharedVaultUuid: string, userUuid: string): boolean

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined

  downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]>
  getOutboundInvites(vaultUuid?: string): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError>
  getTrustedSenderOfInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined
  acceptInvite(invite: SharedVaultInviteServerHash): Promise<boolean>
  getInviteData(invite: SharedVaultInviteServerHash): VaultKeyCopyContentSpecialized | undefined
  getCachedInboundInvites(): SharedVaultInviteServerHash[]
  getInvitableContactsForSharedVault(sharedVaultUuid: string): Promise<TrustedContactInterface[]>
  deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void>
  reloadRemovedSharedVaults(): Promise<void>

  updateInvitesAfterVaultKeyChange(params: {
    keySystemIdentifier: string
    sharedVaultUuid: string
  }): Promise<ClientDisplayableError[]>
}
