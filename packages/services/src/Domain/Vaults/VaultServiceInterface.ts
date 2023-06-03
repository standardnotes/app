import { ClientDisplayableError } from '@standardnotes/responses'
import { DecryptedItemInterface, VaultKeyCopyInterface, VaultKeyCopyContentSpecialized } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent } from './VaultServiceEvent'
import { VaultDisplayListing } from './VaultDisplayListing'

export interface VaultServiceInterface extends AbstractService<VaultServiceEvent> {
  createVault(name?: string, description?: string): Promise<string | ClientDisplayableError>
  getVaultDisplayListings(): VaultDisplayListing[]
  deleteVault(keySystemIdentifier: string): Promise<boolean>

  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyCopyContentSpecialized | undefined
  getVaultInfo(keySystemIdentifier: string): VaultKeyCopyContentSpecialized | undefined

  addItemToVault(keySystemIdentifier: string, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateVaultKey(keySystemIdentifier: string): Promise<void>
  changeVaultNameAndDescription(
    keySystemIdentifier: string,
    params: { name: string; description: string },
  ): Promise<VaultKeyCopyInterface>
}
