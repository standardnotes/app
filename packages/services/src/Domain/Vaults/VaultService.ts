import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
  KeySystemIdentifier,
  VaultDisplayListing,
  isSharedVaultDisplayListing,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { CreateVaultUseCase } from './UseCase/CreateVault'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { RemoveItemFromVault } from './UseCase/RemoveItemFromVault'
import { DeleteVaultUseCase } from './UseCase/DeleteVault'
import { AddItemToVaultUseCase } from './UseCase/AddItemToVault'
import { SharedVaultServiceEvent } from '../SharedVaults/SharedVaultServiceEvent'

import { RotateKeySystemRootKeyUseCase } from './UseCase/RotateKeySystemRootKey'
import { FilesClientInterface } from '@standardnotes/files'
import { GetVaultsUseCase } from './UseCase/GetVaults'

export class VaultService
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]>
  implements VaultServiceInterface, InternalEventHandlerInterface
{
  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private files: FilesClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, SharedVaultServiceEvent.SharedVaultStatusChanged)
  }

  private notifyVaultsChangedEvent(): void {
    void this.notifyEvent(VaultServiceEvent.VaultsChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SharedVaultServiceEvent.SharedVaultStatusChanged) {
      this.notifyVaultsChangedEvent()
    }
  }

  getVaults(): VaultDisplayListing[] {
    const usecase = new GetVaultsUseCase(this.items, this.encryption)
    return usecase.execute()
  }

  public getVault(keySystemIdentifier: KeySystemIdentifier): VaultDisplayListing | undefined {
    const listings = this.getVaults()
    return listings.find((listing) => listing.systemIdentifier === keySystemIdentifier)
  }

  public getSureVault(keySystemIdentifier: KeySystemIdentifier): VaultDisplayListing {
    const vault = this.getVault(keySystemIdentifier)
    if (!vault) {
      throw new Error('Vault not found')
    }
    return vault
  }

  async createRandomizedVault(
    name: string,
    description?: string,
  ): Promise<VaultDisplayListing | ClientDisplayableError> {
    return this.createVaultWithParameters({ name, description, userInputtedPassword: undefined })
  }

  async createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string
  }): Promise<VaultDisplayListing | ClientDisplayableError> {
    return this.createVaultWithParameters(dto)
  }

  private async createVaultWithParameters(dto: {
    name: string
    description?: string
    userInputtedPassword: string | undefined
  }): Promise<VaultDisplayListing | ClientDisplayableError> {
    const createVault = new CreateVaultUseCase(this.items, this.encryption)
    const result = await createVault.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      userInputtedPassword: dto.userInputtedPassword,
    })

    this.notifyVaultsChangedEvent()

    if (!isClientDisplayableError(result)) {
      await this.sync.sync()
      return this.getSureVault(result)
    } else {
      return result
    }
  }

  async addItemToVault(vault: VaultDisplayListing, item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new AddItemToVaultUseCase(this.items, this.sync, this.files)
    await useCase.execute({ vault, item })

    return this.items.findSureItem(item.uuid)
  }

  async removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new RemoveItemFromVault(this.items, this.sync, this.files)
    await useCase.execute({ item })
    return this.items.findSureItem(item.uuid)
  }

  async deleteVault(vault: VaultDisplayListing): Promise<boolean> {
    const useCase = new DeleteVaultUseCase(this.items)
    const error = await useCase.execute(vault)

    if (isClientDisplayableError(error)) {
      return false
    }

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
    return true
  }

  async changeVaultNameAndDescription(
    vault: VaultDisplayListing,
    params: { name: string; description?: string },
  ): Promise<KeySystemRootKeyInterface> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(vault.systemIdentifier)
    if (!keySystemRootKey) {
      throw new Error('Cannot change vault metadata; key system root key not found')
    }

    const updatedKeySystemRootKey = await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
      keySystemRootKey,
      (mutator) => {
        mutator.systemName = params.name
        mutator.systemDescription = params.description
      },
    )

    await this.notifyEventSync(VaultServiceEvent.VaultRootKeyChanged, { vault })

    await this.sync.sync()

    this.notifyVaultsChangedEvent()

    return updatedKeySystemRootKey
  }

  async rotateVaultRootKey(vault: VaultDisplayListing): Promise<void> {
    const useCase = new RotateKeySystemRootKeyUseCase(this.items, this.encryption)
    await useCase.execute({
      keySystemIdentifier: vault.systemIdentifier,
      sharedVaultUuid: isSharedVaultDisplayListing(vault) ? vault.sharedVaultUuid : undefined,
      userInputtedPassword: undefined,
    })

    this.notifyVaultsChangedEvent()

    await this.notifyEventSync(VaultServiceEvent.VaultRootKeyChanged, { vault })

    await this.sync.sync()
  }

  isItemInVault(item: DecryptedItemInterface): boolean {
    return item.key_system_identifier !== undefined
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
