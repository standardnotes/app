import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  KeySystemRootKeyContentSpecialized,
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
  KeySystemIdentifier,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { VaultServiceEvent } from './VaultServiceEvent'
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
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from '../SharedVaults/SharedVaultServiceEvent'
import { VaultDisplayListing } from './VaultDisplayListing'
import { ContentType } from '@standardnotes/common'
import { RotateKeySystemRootKeyUseCase } from './UseCase/RotateKeySystemRootKey'

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
    await this.rotateKeySystemRootKey(keySystemIdentifier)
  }

  getVaultDisplayListings(): VaultDisplayListing[] {
    const primaries: Record<string, KeySystemRootKeyInterface> = {}

    const keySystemRootKeys = this.items.getItems<KeySystemRootKeyInterface>(ContentType.KeySystemRootKey)
    for (const keySystemRootKey of keySystemRootKeys) {
      if (!keySystemRootKey.key_system_identifier) {
        throw new Error('Key system root key copy does not have vault system identifier')
      }

      const primary = this.items.getPrimaryKeySystemRootKey(keySystemRootKey.key_system_identifier)
      if (!primary) {
        throw new Error('Key system does not have primary root key')
      }

      primaries[keySystemRootKey.key_system_identifier] = primary
    }

    return Object.values(primaries).map((primary) => {
      const listing: VaultDisplayListing = {
        systemIdentifier: primary.systemIdentifier,
        name: primary.systemName,
        description: primary.systemDescription,
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
  ): Promise<KeySystemRootKeyInterface> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(keySystemIdentifier)
    if (!keySystemRootKey) {
      throw new Error('Cannot change vault metadata; vault key not found')
    }

    const updatedKeySystemRootKey = await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
      keySystemRootKey,
      (mutator) => {
        mutator.systemName = params.name
        mutator.systemDescription = params.description
      },
    )

    await this.sync.sync()

    this.notifyVaultsChangedEvent()

    return updatedKeySystemRootKey
  }

  async rotateKeySystemRootKey(keySystemIdentifier: KeySystemIdentifier): Promise<void> {
    const useCase = new RotateKeySystemRootKeyUseCase(this.items, this.encryption)
    await useCase.execute({
      keySystemIdentifier,
    })

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
  }

  getVaultInfoForItem(item: DecryptedItemInterface): KeySystemRootKeyContentSpecialized | undefined {
    if (!item.key_system_identifier) {
      return undefined
    }

    return this.getVaultInfo(item.key_system_identifier)
  }

  getVaultInfo(keySystemIdentifier: KeySystemIdentifier): KeySystemRootKeyContentSpecialized | undefined {
    return this.items.getPrimaryKeySystemRootKey(keySystemIdentifier)?.content
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
