import { ClientDisplayableError } from '@standardnotes/responses'
import { DecryptedItemInterface, KeySystemRootKeyInterface, KeySystemIdentifier } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { VaultDisplayListing } from './VaultDisplayListing'

export interface VaultServiceInterface
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]> {
  createVault(name: string, description?: string): Promise<VaultDisplayListing | ClientDisplayableError>
  getVaults(): VaultDisplayListing[]
  getVault(keySystemIdentifier: KeySystemIdentifier): VaultDisplayListing | undefined
  deleteVault(vault: VaultDisplayListing): Promise<boolean>

  addItemToVault(vault: VaultDisplayListing, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateKeySystemRootKey(keySystemIdentifier: KeySystemIdentifier): Promise<void>
  changeVaultNameAndDescription(
    keySystemIdentifier: KeySystemIdentifier,
    params: { name: string; description: string },
  ): Promise<KeySystemRootKeyInterface>
}
