import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  KeySystemIdentifier,
  KeySystemRootKeyPasswordType,
  KeySystemRootKeyStorageType,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { CreateVaultUseCase } from './UseCase/CreateVault'
import { AbstractService } from '../Service/AbstractService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { RemoveItemFromVault } from './UseCase/RemoveItemFromVault'
import { DeleteVaultUseCase } from './UseCase/DeleteVault'
import { AddItemToVaultUseCase } from './UseCase/AddItemToVault'

import { RotateKeySystemRootKeyUseCase } from './UseCase/RotateKeySystemRootKey'
import { FilesClientInterface } from '@standardnotes/files'
import { ContentType } from '@standardnotes/common'
import { GetVaultUseCase } from './UseCase/GetVault'

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
    return this.items.getItems(ContentType.VaultListing)
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

  async createRandomizedVault(
    name: string,
    description?: string,
    storagePreference?: KeySystemRootKeyStorageType,
  ): Promise<VaultListingInterface | ClientDisplayableError> {
    return this.createVaultWithParameters({ name, description, userInputtedPassword: undefined, storagePreference })
  }

  async createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string
    storagePreference?: KeySystemRootKeyStorageType
  }): Promise<VaultListingInterface | ClientDisplayableError> {
    return this.createVaultWithParameters(dto)
  }

  private async createVaultWithParameters(dto: {
    name: string
    description?: string
    userInputtedPassword: string | undefined
    storagePreference?: KeySystemRootKeyStorageType
  }): Promise<VaultListingInterface | ClientDisplayableError> {
    const createVault = new CreateVaultUseCase(this.items, this.encryption, this.sync)
    const result = await createVault.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference ?? KeySystemRootKeyStorageType.Synced,
    })

    return result
  }

  async addItemToVault(vault: VaultListingInterface, item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new AddItemToVaultUseCase(this.items, this.sync, this.files)
    await useCase.execute({ vault, item })

    return this.items.findSureItem(item.uuid)
  }

  async removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
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
    const useCase = new RotateKeySystemRootKeyUseCase(this.items, this.encryption)
    await useCase.execute({
      keySystemIdentifier: vault.systemIdentifier,
      sharedVaultUuid: vault.isSharedVaultListing() ? vault.sharing.sharedVaultUuid : undefined,
      userInputtedPassword: undefined,
    })

    await this.notifyEventSync(VaultServiceEvent.VaultRootKeyRotated, { vault })

    await this.sync.sync()
  }

  isItemInVault(item: DecryptedItemInterface): boolean {
    return item.key_system_identifier !== undefined
  }

  unlockNonPersistentVault(vault: VaultListingInterface, password: string): void {
    if (vault.rootKeyPasswordType !== KeySystemRootKeyPasswordType.UserInputted) {
      throw new Error('Vault uses randomized password and cannot be unlocked with user inputted password')
    }

    if (vault.rootKeyStorage === KeySystemRootKeyStorageType.Synced) {
      throw new Error('Vault uses synced root key and cannot be unlocked with user inputted password')
    }

    const rootKey = this.encryption.deriveUserInputtedKeySystemRootKey({
      keyParams: vault.rootKeyParams,
      userInputtedPassword: password,
    })

    this.encryption.keys.intakeNonPersistentKeySystemRootKey(rootKey, vault.rootKeyStorage)
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
