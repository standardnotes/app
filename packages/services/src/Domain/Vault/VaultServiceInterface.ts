import {
  DecryptedItemInterface,
  KeySystemIdentifier,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { ChangeVaultKeyOptionsDTO } from './UseCase/ChangeVaultKeyOptionsDTO'
import { Result } from '@standardnotes/domain-core'

export interface VaultServiceInterface
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]> {
  createRandomizedVault(dto: { name: string; description?: string }): Promise<VaultListingInterface>
  createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface>

  getVaults(): VaultListingInterface[]
  getVault(dto: { keySystemIdentifier: KeySystemIdentifier }): VaultListingInterface | undefined
  deleteVault(vault: VaultListingInterface): Promise<boolean>

  moveItemToVault(
    vault: VaultListingInterface,
    item: DecryptedItemInterface,
  ): Promise<DecryptedItemInterface | undefined>
  removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean
  getItemVault(item: DecryptedItemInterface): VaultListingInterface | undefined

  changeVaultNameAndDescription(
    vault: VaultListingInterface,
    params: { name: string; description: string },
  ): Promise<VaultListingInterface>
  rotateVaultRootKey(vault: VaultListingInterface, vaultPassword?: string): Promise<void>
  changeVaultOptions(dto: ChangeVaultKeyOptionsDTO): Promise<Result<void>>
}
