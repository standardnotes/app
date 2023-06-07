import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultUserServerHash,
  SharedVaultPermission,
} from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  TrustedContactInterface,
  KeySystemIdentifier,
  SharedVaultDisplayListing,
  VaultDisplayListing,
  SharedVaultMessage,
  SharedVaultMessageRootKey,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'

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
  acceptTrustedRootKeyInvite(
    invite: SharedVaultInviteServerHash,
    decryptedMessage: SharedVaultMessageRootKey,
  ): Promise<void>
  getInviteDataMessageAndTrustStatus(
    invite: SharedVaultInviteServerHash,
  ): { trusted: boolean; message: SharedVaultMessage } | undefined
  getCachedInboundInvites(): SharedVaultInviteServerHash[]
  getInvitableContactsForSharedVault(sharedVault: SharedVaultDisplayListing): Promise<TrustedContactInterface[]>
  deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void>

  updateInvitesAfterKeySystemRootKeyChange(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVault: SharedVaultDisplayListing
  }): Promise<ClientDisplayableError[]>
}
