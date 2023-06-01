import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  VaultKeyCopyInterface,
  VaultKeyMutator,
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
import { GroupServiceEvent, GroupServiceEventPayload } from '../Groups/GroupServiceEvent'
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

    eventBus.addEventHandler(this, GroupServiceEvent.GroupStatusChanged)
    eventBus.addEventHandler(this, GroupServiceEvent.GroupMemberRemoved)
  }

  private notifyVaultsChangedEvent(): void {
    void this.notifyEvent(VaultServiceEvent.VaultsChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === GroupServiceEvent.GroupStatusChanged) {
      this.notifyVaultsChangedEvent()
    } else if (event.type === GroupServiceEvent.GroupMemberRemoved) {
      await this.handleGroupMemberRemovedEvent((event.payload as GroupServiceEventPayload).vaultSystemIdentifier)
    }
  }

  private async handleGroupMemberRemovedEvent(vaultSystemIdentifier: string): Promise<void> {
    await this.rotateVaultKey(vaultSystemIdentifier)
  }

  getVaultDisplayListings(): VaultDisplayListing[] {
    const vaultKeyCopies = this.items.getItems<VaultKeyCopyInterface>(ContentType.VaultKeyCopy)
    const primaries: Record<string, VaultKeyCopyInterface> = {}
    for (const vaultKey of vaultKeyCopies) {
      if (!vaultKey.vault_system_identifier) {
        throw new Error('Vault key copy does not have vault system identifier')
      }
      const primary = this.items.getPrimarySyncedVaultKeyCopy(vaultKey.vault_system_identifier)
      if (!primary) {
        throw new Error('Vault key copy does not have primary')
      }
      primaries[vaultKey.vault_system_identifier] = primary
    }

    return Object.values(primaries).map((primary) => {
      const listing: VaultDisplayListing = {
        vaultSystemIdentifier: primary.vaultSystemIdentifier,
        name: primary.vaultName,
        description: primary.vaultDescription,
      }
      return listing
    })
  }

  async createVault(name: string, description?: string): Promise<string | ClientDisplayableError> {
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

  async addItemToVault(vaultSystemIdentifier: string, item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new AddItemToVaultUseCase(this.items, this.sync)
    await useCase.execute({ vaultSystemIdentifier, item })

    return this.items.findSureItem(item.uuid)
  }

  async moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new RemoveItemFromVault(this.items, this.sync)
    await useCase.execute({ item })

    return this.items.findSureItem(item.uuid)
  }

  async deleteVault(vaultSystemIdentifier: string): Promise<boolean> {
    const useCase = new DeleteVaultUseCase(this.items)
    const error = await useCase.execute({ vaultSystemIdentifier })

    if (isClientDisplayableError(error)) {
      return false
    }

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
    return true
  }

  async changeVaultNameAndDescription(
    vaultSystemIdentifier: string,
    params: { name: string; description?: string },
  ): Promise<VaultKeyCopyInterface> {
    const vaultKey = this.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)
    if (!vaultKey) {
      throw new Error('Cannot change vault metadata; vault key not found')
    }

    const updatedVaultKey = await this.items.changeItem<VaultKeyMutator, VaultKeyCopyInterface>(vaultKey, (mutator) => {
      mutator.vaultName = params.name
      mutator.vaultDescription = params.description
    })

    await this.sync.sync()

    this.notifyVaultsChangedEvent()

    return updatedVaultKey
  }

  async rotateVaultKey(vaultSystemIdentifier: string): Promise<void> {
    const useCase = new RotateVaultKeyUseCase(this.items, this.encryption)
    await useCase.execute({
      vaultSystemIdentifier,
    })

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
  }

  getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier: string): VaultKeyCopyInterface | undefined {
    return this.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)
  }

  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyCopyContentSpecialized | undefined {
    if (!item.vault_system_identifier) {
      return undefined
    }

    return this.getVaultInfo(item.vault_system_identifier)
  }

  getVaultInfo(vaultSystemIdentifier: string): VaultKeyCopyContentSpecialized | undefined {
    return this.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)?.content
  }

  isItemInVault(item: DecryptedItemInterface): boolean {
    return item.vault_system_identifier !== undefined
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
