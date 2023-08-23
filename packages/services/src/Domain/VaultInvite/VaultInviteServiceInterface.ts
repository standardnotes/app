import { InviteRecord } from './InviteRecord'
import { ApplicationServiceInterface } from '../Service/ApplicationServiceInterface'
import { SharedVaultListingInterface, TrustedContactInterface } from '@standardnotes/models'
import { ClientDisplayableError, SharedVaultInviteServerHash } from '@standardnotes/responses'
import { VaultInviteServiceEvent } from './VaultInviteServiceEvent'
import { Result } from '@standardnotes/domain-core'

export interface VaultInviteServiceInterface extends ApplicationServiceInterface<VaultInviteServiceEvent, unknown> {
  getInvitableContactsForSharedVault(sharedVault: SharedVaultListingInterface): Promise<TrustedContactInterface[]>
  inviteContactToSharedVault(
    sharedVault: SharedVaultListingInterface,
    contact: TrustedContactInterface,
    permission: string,
  ): Promise<Result<SharedVaultInviteServerHash>>
  getCachedPendingInviteRecords(): InviteRecord[]
  deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void>
  downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]>
  getOutboundInvites(
    sharedVault?: SharedVaultListingInterface,
  ): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError>
  acceptInvite(pendingInvite: InviteRecord): Promise<Result<void>>
}
