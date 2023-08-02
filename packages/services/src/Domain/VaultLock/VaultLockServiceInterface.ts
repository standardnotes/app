import { VaultListingInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultLockServiceEvent, VaultLockServiceEventPayload } from './VaultLockServiceEvent'

export interface VaultLockServiceInterface
  extends AbstractService<VaultLockServiceEvent, VaultLockServiceEventPayload[VaultLockServiceEvent]> {
  getLockedvaults(): VaultListingInterface[]
  isVaultLocked(vault: VaultListingInterface): boolean
  isVaultLockable(vault: VaultListingInterface): boolean
  lockNonPersistentVault(vault: VaultListingInterface): Promise<void>
  unlockNonPersistentVault(vault: VaultListingInterface, password: string): Promise<boolean>
}
