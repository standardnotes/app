import { isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  KeySystemIdentifier,
  KeySystemRootKeyPasswordType,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { ChangeVaultOptionsDTO } from './ChangeVaultOptionsDTO'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { CreateVaultUseCase } from './UseCase/CreateVault'
import { AbstractService } from '../Service/AbstractService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { RemoveItemFromVault } from './UseCase/RemoveItemFromVault'
import { DeleteVaultUseCase } from './UseCase/DeleteVault'
import { AddItemsToVaultUseCase } from './UseCase/AddItemsToVault'

import { RotateVaultRootKeyUseCase } from './UseCase/RotateVaultRootKey'
import { FilesClientInterface } from '@standardnotes/files'
import { ContentType } from '@standardnotes/common'
import { GetVaultUseCase } from './UseCase/GetVault'
import { ChangeVaultKeyOptionsUseCase } from './UseCase/ChangeVaultKeyOptions'

export class VaultService
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]>
  implements VaultServiceInterface
{
  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private files: FilesClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  getVaults(): VaultListingInterface[] {
    return this.items.getItems<VaultListingInterface>(ContentType.VaultListing).sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  }

  public getVault(keySystemIdentifier: KeySystemIdentifier): VaultListingInterface | undefined {
    const usecase = new GetVaultUseCase(this.items)
    return usecase.execute({ keySystemIdentifier })
  }

  public getSureVault(keySystemIdentifier: KeySystemIdentifier): VaultListingInterface {
    const vault = this.getVault(keySystemIdentifier)
    if (!vault) {
      throw new Error('Vault not found')
    }

    return vault
  }

  async createRandomizedVault(dto: {
    name: string
    description?: string
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface> {
    return this.createVaultWithParameters({
      name: dto.name,
      description: dto.description,
      userInputtedPassword: undefined,
      storagePreference: dto.storagePreference,
    })
  }

  async createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface> {
    return this.createVaultWithParameters(dto)
  }

  private async createVaultWithParameters(dto: {
    name: string
    description?: string
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface> {
    const createVault = new CreateVaultUseCase(this.items, this.encryption, this.sync)
    const result = await createVault.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference,
    })

    return result
  }

  async addItemToVault(vault: VaultListingInterface, item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    if (this.isVaultLocked(vault)) {
      throw new Error('Attempting to add item to locked vault')
    }

    if (this.getItemVault(item)) {
      await this.removeItemFromVault(item)
    }

    const useCase = new AddItemsToVaultUseCase(this.items, this.sync, this.files)
    await useCase.execute({ vault, items: [item] })

    return this.items.findSureItem(item.uuid)
  }

  async removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const vault = this.getItemVault(item)
    if (!vault) {
      throw new Error('Item does not belong to any vault')
    }

    if (this.isVaultLocked(vault)) {
      throw new Error('Attempting to remove item from locked vault')
    }

    const useCase = new RemoveItemFromVault(this.items, this.sync, this.files)
    await useCase.execute({ item })
    return this.items.findSureItem(item.uuid)
  }

  async deleteVault(vault: VaultListingInterface): Promise<boolean> {
    const useCase = new DeleteVaultUseCase(this.items, this.encryption)
    const error = await useCase.execute(vault)

    if (isClientDisplayableError(error)) {
      return false
    }

    await this.sync.sync()
    return true
  }

  async changeVaultNameAndDescription(
    vault: VaultListingInterface,
    params: { name: string; description?: string },
  ): Promise<VaultListingInterface> {
    const updatedVault = await this.items.changeItem<VaultListingMutator, VaultListingInterface>(vault, (mutator) => {
      mutator.name = params.name
      mutator.description = params.description
    })

    await this.sync.sync()

    return updatedVault
  }

  async rotateVaultRootKey(vault: VaultListingInterface): Promise<void> {
    if (this.isVaultLocked(vault)) {
      throw new Error('Cannot rotate root key of locked vault')
    }

    const useCase = new RotateVaultRootKeyUseCase(this.items, this.encryption)
    await useCase.execute({
      vault,
      sharedVaultUuid: vault.isSharedVaultListing() ? vault.sharing.sharedVaultUuid : undefined,
      userInputtedPassword: undefined,
    })

    await this.notifyEventSync(VaultServiceEvent.VaultRootKeyRotated, { vault })

    await this.sync.sync()
  }

  isItemInVault(item: DecryptedItemInterface): boolean {
    return item.key_system_identifier !== undefined
  }

  getItemVault(item: DecryptedItemInterface): VaultListingInterface | undefined {
    if (!item.key_system_identifier) {
      return undefined
    }

    return this.getVault(item.key_system_identifier)
  }

  async changeVaultOptions(dto: ChangeVaultOptionsDTO): Promise<void> {
    if (this.isVaultLocked(dto.vault)) {
      throw new Error('Attempting to change vault options on a locked vault')
    }

    const usecase = new ChangeVaultKeyOptionsUseCase(this.items, this.sync, this.encryption)
    await usecase.execute(dto)

    if (dto.newPasswordType) {
      await this.notifyEventSync(VaultServiceEvent.VaultRootKeyRotated, { vault: dto.vault })
    }
  }

  isVaultLocked(vault: VaultListingInterface): boolean {
    const rootKey = this.encryption.keys.getPrimaryKeySystemRootKey(vault.systemIdentifier)
    if (!rootKey) {
      return true
    }

    const itemsKey = this.encryption.keys.getPrimaryKeySystemItemsKey(vault.systemIdentifier)
    if (!itemsKey) {
      return true
    }

    return false
  }

  public async unlockNonPersistentVault(vault: VaultListingInterface, password: string): Promise<boolean> {
    if (vault.keyPasswordType !== KeySystemRootKeyPasswordType.UserInputted) {
      throw new Error('Vault uses randomized password and cannot be unlocked with user inputted password')
    }

    if (vault.keyStorageMode === KeySystemRootKeyStorageMode.Synced) {
      throw new Error('Vault uses synced root key and cannot be unlocked with user inputted password')
    }

    const derivedRootKey = this.encryption.deriveUserInputtedKeySystemRootKey({
      keyParams: vault.rootKeyParams,
      userInputtedPassword: password,
    })

    this.encryption.keys.intakeNonPersistentKeySystemRootKey(derivedRootKey, vault.keyStorageMode)

    await this.encryption.decryptErroredPayloads()

    if (this.isVaultLocked(vault)) {
      this.encryption.keys.undoIntakeNonPersistentKeySystemRootKey(vault.systemIdentifier)
      return false
    }

    void this.notifyEventSync(VaultServiceEvent.VaultUnlocked, { vault })

    return true
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
