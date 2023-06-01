import { ClientDisplayableError } from '@standardnotes/responses'
import { DecryptedItemInterface, VaultKeyCopyInterface, VaultKeyCopyContentSpecialized } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent } from './VaultServiceEvent'
import { VaultDisplayListing } from './VaultDisplayListing'

export interface VaultServiceInterface extends AbstractService<VaultServiceEvent> {
  createVault(name?: string, description?: string): Promise<string | ClientDisplayableError>
  getVaultDisplayListings(): VaultDisplayListing[]
  deleteVault(vaultSystemIdentifier: string): Promise<boolean>

  getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier: string): VaultKeyCopyInterface | undefined
  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyCopyContentSpecialized | undefined
  getVaultInfo(vaultSystemIdentifier: string): VaultKeyCopyContentSpecialized | undefined

  addItemToVault(vaultSystemIdentifier: string, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateVaultKey(vaultSystemIdentifier: string): Promise<void>
  changeVaultNameAndDescription(
    vaultSystemIdentifier: string,
    params: { name: string; description: string },
  ): Promise<VaultKeyCopyInterface>
}
