import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  VaultKeyCopyInterface,
  VaultKeyMutator,
  KeySystemIdentifier,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { VaultServiceEvent } from './VaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { CreateVaultUseCase } from './UseCase/CreateVault'
import { RotateVaultKeyUseCase } from './UseCase/RotateVaultKey'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { RemoveItemFromVault } from './UseCase/RemoveItemFromVault'
import { DeleteVaultUseCase } from './UseCase/DeleteVault'
import { AddItemToVaultUseCase } from './UseCase/AddItemToVault'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from '../SharedVaults/SharedVaultServiceEvent'
import { VaultDisplayListing } from './VaultDisplayListing'
import { ContentType } from '@standardnotes/common'

export class VaultService
  extends AbstractService<VaultServiceEvent>
  implements VaultServiceInterface, InternalEventHandlerInterface
{
  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, SharedVaultServiceEvent.SharedVaultStatusChanged)
    eventBus.addEventHandler(this, SharedVaultServiceEvent.SharedVaultMemberRemoved)
  }

  private notifyVaultsChangedEvent(): void {
    void this.notifyEvent(VaultServiceEvent.VaultsChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SharedVaultServiceEvent.SharedVaultStatusChanged) {
      this.notifyVaultsChangedEvent()
    } else if (event.type === SharedVaultServiceEvent.SharedVaultMemberRemoved) {
      await this.handleSharedVaultMemberRemovedEvent(
        (event.payload as SharedVaultServiceEventPayload).keySystemIdentifier,
      )
    }
  }

  private async handleSharedVaultMemberRemovedEvent(keySystemIdentifier: KeySystemIdentifier): Promise<void> {
    await this.rotateVaultKey(keySystemIdentifier)
  }

  getVaultDisplayListings(): VaultDisplayListing[] {
    const primaries: Record<string, VaultKeyCopyInterface> = {}

    const vaultKeyCopies = this.items.getItems<VaultKeyCopyInterface>(ContentType.VaultKeyCopy)
    for (const vaultKeyCopy of vaultKeyCopies) {
      if (!vaultKeyCopy.key_system_identifier) {
        throw new Error('Vault key copy does not have vault system identifier')
      }

      const primary = this.items.getPrimarySyncedVaultKeyCopy(vaultKeyCopy.key_system_identifier)
      if (!primary) {
        throw new Error('Vault key copy does not have primary')
      }

      primaries[vaultKeyCopy.key_system_identifier] = primary
    }

    return Object.values(primaries).map((primary) => {
      const listing: VaultDisplayListing = {
        keySystemIdentifier: primary.keySystemIdentifier,
        name: primary.vaultName,
        description: primary.vaultDescription,
      }
      return listing
    })
  }

  async createVault(name: string, description?: string): Promise<KeySystemIdentifier | ClientDisplayableError> {
    const createVault = new CreateVaultUseCase(this.items, this.encryption)
    const result = await createVault.execute({
      vaultName: name,
      vaultDescription: description,
    })

    this.notifyVaultsChangedEvent()

    if (!isClientDisplayableError(result)) {
      await this.sync.sync()
      return result
    } else {
      return result
    }
  }

  async addItemToVault(
    keySystemIdentifier: KeySystemIdentifier,
    item: DecryptedItemInterface,
  ): Promise<DecryptedItemInterface> {
    const useCase = new AddItemToVaultUseCase(this.items, this.sync)
    await useCase.execute({ keySystemIdentifier, item })

    return this.items.findSureItem(item.uuid)
  }

  async removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new RemoveItemFromVault(this.items, this.sync)
    await useCase.execute({ item })

    return this.items.findSureItem(item.uuid)
  }

  async deleteVault(keySystemIdentifier: KeySystemIdentifier): Promise<boolean> {
    const useCase = new DeleteVaultUseCase(this.items)
    const error = await useCase.execute({ keySystemIdentifier })

    if (isClientDisplayableError(error)) {
      return false
    }

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
    return true
  }

  async changeVaultNameAndDescription(
    keySystemIdentifier: KeySystemIdentifier,
    params: { name: string; description?: string },
  ): Promise<VaultKeyCopyInterface> {
    const vaultKeyCopy = this.items.getPrimarySyncedVaultKeyCopy(keySystemIdentifier)
    if (!vaultKeyCopy) {
      throw new Error('Cannot change vault metadata; vault key not found')
    }

    const updatedVaultKey = await this.items.changeItem<VaultKeyMutator, VaultKeyCopyInterface>(
      vaultKeyCopy,
      (mutator) => {
        mutator.vaultName = params.name
        mutator.vaultDescription = params.description
      },
    )

    await this.sync.sync()

    this.notifyVaultsChangedEvent()

    return updatedVaultKey
  }

  async rotateVaultKey(keySystemIdentifier: KeySystemIdentifier): Promise<void> {
    const useCase = new RotateVaultKeyUseCase(this.items, this.encryption)
    await useCase.execute({
      keySystemIdentifier,
    })

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
  }

  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyCopyContentSpecialized | undefined {
    if (!item.key_system_identifier) {
      return undefined
    }

    return this.getVaultInfo(item.key_system_identifier)
  }

  getVaultInfo(keySystemIdentifier: KeySystemIdentifier): VaultKeyCopyContentSpecialized | undefined {
    return this.items.getPrimarySyncedVaultKeyCopy(keySystemIdentifier)?.content
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
