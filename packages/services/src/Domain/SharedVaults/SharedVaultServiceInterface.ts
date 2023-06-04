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
  KeySystemRootKeyContentSpecialized,
  TrustedContactInterface,
  KeySystemIdentifier,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'
import { VaultDisplayListing } from '../Vaults/VaultDisplayListing'

export interface SharedVaultServiceInterface
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload> {
  createSharedVault(name: string, description?: string): Promise<VaultDisplayListing | ClientDisplayableError>

  inviteContactToSharedVault(
    sharedVault: SharedVaultServerHash,
    contact: TrustedContact,
    permissions: SharedVaultPermission,
  ): Promise<SharedVaultInviteServerHash | ClientDisplayableError>
  removeUserFromSharedVault(sharedVaultUuid: string, userUuid: string): Promise<ClientDisplayableError | void>
  leaveSharedVault(sharedVaultUuid: string): Promise<ClientDisplayableError | void>
  getSharedVaultUsers(keySystemIdentifier: KeySystemIdentifier): Promise<SharedVaultUserServerHash[] | undefined>
  isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean
  isCurrentUserSharedVaultAdmin(sharedVaultUuid: string, userUuid: string): boolean

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined

  downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]>
  getOutboundInvites(vaultUuid?: string): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError>
  getTrustedSenderOfInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined
  acceptInvite(invite: SharedVaultInviteServerHash): Promise<boolean>
  getInviteData(invite: SharedVaultInviteServerHash): KeySystemRootKeyContentSpecialized | undefined
  getCachedInboundInvites(): SharedVaultInviteServerHash[]
  getInvitableContactsForSharedVault(sharedVaultUuid: string): Promise<TrustedContactInterface[]>
  deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void>

  updateInvitesAfterKeySystemRootKeyChange(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
  }): Promise<ClientDisplayableError[]>
}
