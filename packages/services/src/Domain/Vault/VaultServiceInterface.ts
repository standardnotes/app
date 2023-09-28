import {
  DecryptedItemInterface,
  EmojiString,
  IconType,
  KeySystemIdentifier,
  KeySystemRootKeyStorageMode,
  SharedVaultListingInterface,
  VaultListingInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { ChangeVaultKeyOptionsDTO } from './UseCase/ChangeVaultKeyOptionsDTO'
import { Result } from '@standardnotes/domain-core'

export interface VaultServiceInterface
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]> {
  createRandomizedVault(dto: {
    name: string
    description?: string
    iconString: IconType | EmojiString
  }): Promise<VaultListingInterface>
  createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    iconString: IconType | EmojiString
    userInputtedPassword: string
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface>

  getVaults(): VaultListingInterface[]
  getVault(dto: { keySystemIdentifier: KeySystemIdentifier }): Result<VaultListingInterface>
  authorizeVaultDeletion(vault: VaultListingInterface): Promise<Result<boolean>>
  deleteVault(vault: VaultListingInterface): Promise<boolean>

  moveItemToVault(vault: VaultListingInterface, item: DecryptedItemInterface): Promise<Result<DecryptedItemInterface>>
  removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean
  getItemVault(item: DecryptedItemInterface): VaultListingInterface | undefined

  changeVaultMetadata(
    vault: VaultListingInterface,
    params: { name: string; description: string; iconString: IconType | EmojiString },
  ): Promise<VaultListingInterface>
  rotateVaultRootKey(vault: VaultListingInterface, vaultPassword?: string): Promise<void>

  changeVaultKeyOptions(dto: ChangeVaultKeyOptionsDTO): Promise<Result<void>>
  changeThirdPartyVaultStorageOptions(dto: {
    vault: SharedVaultListingInterface
    newStorageMode: KeySystemRootKeyStorageMode | undefined
    vaultPassword: string
  }): Promise<Result<void>>
}
