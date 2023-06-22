import {
  DecryptedItemInterface,
  KeySystemIdentifier,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { ChangeVaultOptionsDTO } from './ChangeVaultOptionsDTO'

export interface VaultServiceInterface
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]> {
  createRandomizedVault(dto: {
    name: string
    description?: string
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface>
  createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string
    storagePreference: KeySystemRootKeyStorageMode
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
  changeVaultOptions(dto: ChangeVaultOptionsDTO): Promise<void>

  unlockNonPersistentVault(vault: VaultListingInterface, password: string): void
}
