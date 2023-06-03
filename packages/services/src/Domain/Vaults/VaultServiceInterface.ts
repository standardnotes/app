import { ClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  KeySystemRootKeyInterface,
  KeySystemRootKeyContentSpecialized,
  KeySystemIdentifier,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent } from './VaultServiceEvent'
import { VaultDisplayListing } from './VaultDisplayListing'

export interface VaultServiceInterface extends AbstractService<VaultServiceEvent> {
  createVault(name: string, description?: string): Promise<string | ClientDisplayableError>
  getVaultDisplayListings(): VaultDisplayListing[]
  deleteVault(keySystemIdentifier: KeySystemIdentifier): Promise<boolean>

  getVaultInfoForItem(item: DecryptedItemInterface): KeySystemRootKeyContentSpecialized | undefined
  getVaultInfo(keySystemIdentifier: KeySystemIdentifier): KeySystemRootKeyContentSpecialized | undefined

  addItemToVault(
    keySystemIdentifier: KeySystemIdentifier,
    item: DecryptedItemInterface,
  ): Promise<DecryptedItemInterface>
  removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateKeySystemRootKey(keySystemIdentifier: KeySystemIdentifier): Promise<void>
  changeVaultNameAndDescription(
    keySystemIdentifier: KeySystemIdentifier,
    params: { name: string; description: string },
  ): Promise<KeySystemRootKeyInterface>
}
