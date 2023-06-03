import { ClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  VaultKeyCopyInterface,
  VaultKeyCopyContentSpecialized,
  KeySystemIdentifier,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent } from './VaultServiceEvent'
import { VaultDisplayListing } from './VaultDisplayListing'

export interface VaultServiceInterface extends AbstractService<VaultServiceEvent> {
  createVault(name?: string, description?: string): Promise<string | ClientDisplayableError>
  getVaultDisplayListings(): VaultDisplayListing[]
  deleteVault(keySystemIdentifier: KeySystemIdentifier): Promise<boolean>

  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyCopyContentSpecialized | undefined
  getVaultInfo(keySystemIdentifier: KeySystemIdentifier): VaultKeyCopyContentSpecialized | undefined

  addItemToVault(
    keySystemIdentifier: KeySystemIdentifier,
    item: DecryptedItemInterface,
  ): Promise<DecryptedItemInterface>
  moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateVaultKey(keySystemIdentifier: KeySystemIdentifier): Promise<void>
  changeVaultNameAndDescription(
    keySystemIdentifier: KeySystemIdentifier,
    params: { name: string; description: string },
  ): Promise<VaultKeyCopyInterface>
}
