import { ApplicationServiceInterface } from './../Service/ApplicationServiceInterface'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { ClientDisplayableError, SharedVaultUserServerHash } from '@standardnotes/responses'
import { VaultUserServiceEvent } from './VaultUserServiceEvent'
import { Result } from '@standardnotes/domain-core'

export interface VaultUserServiceInterface extends ApplicationServiceInterface<VaultUserServiceEvent, unknown> {
  getSharedVaultUsers(sharedVault: SharedVaultListingInterface): Promise<SharedVaultUserServerHash[] | undefined>
  isCurrentUserSharedVaultOwner(sharedVault: SharedVaultListingInterface): boolean
  removeUserFromSharedVault(sharedVault: SharedVaultListingInterface, userUuid: string): Promise<Result<void>>
  leaveSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void>
  isVaultUserOwner(user: SharedVaultUserServerHash): boolean
}
