import { ApplicationServiceInterface } from './../Service/ApplicationServiceInterface'
import { SharedVaultListingInterface, VaultListingInterface } from '@standardnotes/models'
import { ClientDisplayableError, SharedVaultUserServerHash } from '@standardnotes/responses'
import { VaultUserServiceEvent } from './VaultUserServiceEvent'
import { Result } from '@standardnotes/domain-core'

export interface VaultUserServiceInterface extends ApplicationServiceInterface<VaultUserServiceEvent, unknown> {
  getSharedVaultUsersFromServer(
    sharedVault: SharedVaultListingInterface,
  ): Promise<SharedVaultUserServerHash[] | undefined>
  isCurrentUserSharedVaultOwner(sharedVault: SharedVaultListingInterface): boolean
  isCurrentUserSharedVaultAdmin(sharedVault: SharedVaultListingInterface): boolean
  isCurrentUserReadonlyVaultMember(vault: VaultListingInterface): boolean
  removeUserFromSharedVault(sharedVault: SharedVaultListingInterface, userUuid: string): Promise<Result<void>>
  designateSurvivor(sharedVault: SharedVaultListingInterface, userUuid: string): Promise<Result<void>>
  leaveSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void>
  isVaultUserOwner(user: SharedVaultUserServerHash): boolean
  getFormattedMemberPermission(permission: string): string
  invalidateVaultUsersCache(sharedVaultUuid?: string): Promise<void>
}
