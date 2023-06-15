import { ClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  KeySystemRootKeyInterface,
  KeySystemIdentifier,
  VaultDisplayListing,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'

export interface VaultServiceInterface
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]> {
  createRandomizedVault(name: string, description?: string): Promise<VaultDisplayListing | ClientDisplayableError>
  getVaults(): VaultDisplayListing[]
  getVault(keySystemIdentifier: KeySystemIdentifier): VaultDisplayListing | undefined
  deleteVault(vault: VaultDisplayListing): Promise<boolean>

  addItemToVault(vault: VaultDisplayListing, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateVaultRootKey(vault: VaultDisplayListing): Promise<void>
  changeVaultNameAndDescription(
    vault: VaultDisplayListing,
    params: { name: string; description: string },
  ): Promise<KeySystemRootKeyInterface>
}
