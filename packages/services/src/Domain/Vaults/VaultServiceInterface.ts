import { ClientDisplayableError } from '@standardnotes/responses'
import { DecryptedItemInterface, KeySystemIdentifier, VaultListingInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'

export interface VaultServiceInterface
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]> {
  createRandomizedVault(name: string, description?: string): Promise<VaultListingInterface | ClientDisplayableError>
  getVaults(): VaultListingInterface[]
  getVault(keySystemIdentifier: KeySystemIdentifier): VaultListingInterface | undefined
  deleteVault(vault: VaultListingInterface): Promise<boolean>

  addItemToVault(vault: VaultListingInterface, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateVaultRootKey(vault: VaultListingInterface): Promise<void>
  changeVaultNameAndDescription(
    vault: VaultListingInterface,
    params: { name: string; description: string },
  ): Promise<VaultListingInterface>
}
