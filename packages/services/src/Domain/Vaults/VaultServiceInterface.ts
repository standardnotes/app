import {
  DecryptedItemInterface,
  KeySystemIdentifier,
  KeySystemRootKeyStorageType,
  VaultListingInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'

export interface VaultServiceInterface
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]> {
  createRandomizedVault(dto: {
    name: string
    description?: string
    storagePreference: KeySystemRootKeyStorageType
  }): Promise<VaultListingInterface>
  createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string
    storagePreference: KeySystemRootKeyStorageType
  }): Promise<VaultListingInterface>

  getVaults(): VaultListingInterface[]
  getVault(keySystemIdentifier: KeySystemIdentifier): VaultListingInterface | undefined
  deleteVault(vault: VaultListingInterface): Promise<boolean>

  addItemToVault(vault: VaultListingInterface, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean
  getItemVault(item: DecryptedItemInterface): VaultListingInterface | undefined

  changeVaultNameAndDescription(
    vault: VaultListingInterface,
    params: { name: string; description: string },
  ): Promise<VaultListingInterface>
  rotateVaultRootKey(vault: VaultListingInterface): Promise<void>
  changeVaultKeyStoragePreference(vault: VaultListingInterface, preference: KeySystemRootKeyStorageType): Promise<void>
  changeVaultPasswordTypeFromRandomizedToUserInputted(
    vault: VaultListingInterface,
    userInputtedPassword: string,
  ): Promise<void>
  changeVaultPasswordTypeFromUserInputtedToRandomized(vault: VaultListingInterface): Promise<void>

  unlockNonPersistentVault(vault: VaultListingInterface, password: string): void
}
