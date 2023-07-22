import { isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  FileItem,
  KeySystemIdentifier,
  KeySystemRootKeyPasswordType,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
  VaultListingMutator,
  isNote,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { ChangeVaultOptionsDTO } from './ChangeVaultOptionsDTO'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { CreateVault } from './UseCase/CreateVault'
import { AbstractService } from '../Service/AbstractService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { RemoveItemFromVault } from './UseCase/RemoveItemFromVault'
import { DeleteVault } from './UseCase/DeleteVault'
import { MoveItemsToVault } from './UseCase/MoveItemsToVault'
import { RotateVaultKey } from './UseCase/RotateVaultKey'
import { GetVault } from './UseCase/GetVault'
import { ChangeVaultKeyOptions } from './UseCase/ChangeVaultKeyOptions'
import { MutatorClientInterface } from '../Mutator/MutatorClientInterface'
import { AlertService } from '../Alert/AlertService'
import { ContentType } from '@standardnotes/domain-core'

export class VaultService
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]>
  implements VaultServiceInterface
{
  private lockMap = new Map<VaultListingInterface['uuid'], boolean>()

  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private encryption: EncryptionProviderInterface,
    private alerts: AlertService,
    private getVaultUseCase: GetVault,
    private changeVaultKeyOptions: ChangeVaultKeyOptions,
    private moveItemsToVault: MoveItemsToVault,
    private createVault: CreateVault,
    private removeItemFromVaultUseCase: RemoveItemFromVault,
    private deleteVaultUseCase: DeleteVault,
    private rotateVaultKey: RotateVaultKey,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    items.addObserver(
      [ContentType.TYPES.KeySystemItemsKey, ContentType.TYPES.KeySystemRootKey, ContentType.TYPES.VaultListing],
      () => {
        void this.recomputeAllVaultsLockingState()
      },
    )
  }

  getVaults(): VaultListingInterface[] {
    return this.items.getItems<VaultListingInterface>(ContentType.TYPES.VaultListing).sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  }

  getLockedvaults(): VaultListingInterface[] {
    const vaults = this.getVaults()
    return vaults.filter((vault) => this.isVaultLocked(vault))
  }

  public getVault(dto: { keySystemIdentifier: KeySystemIdentifier }): VaultListingInterface | undefined {
    const result = this.getVaultUseCase.execute(dto)
    if (result.isFailed()) {
      return undefined
    }

    return result.getValue()
  }

  public getSureVault(dto: { keySystemIdentifier: KeySystemIdentifier }): VaultListingInterface {
    const vault = this.getVault(dto)
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
    const result = await this.createVault.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference,
    })

    return result
  }

  async moveItemToVault(
    vault: VaultListingInterface,
    item: DecryptedItemInterface,
  ): Promise<DecryptedItemInterface | undefined> {
    if (this.isVaultLocked(vault)) {
      throw new Error('Attempting to add item to locked vault')
    }

    let linkedFiles: FileItem[] = []
    if (isNote(item)) {
      linkedFiles = this.items.getNoteLinkedFiles(item)

      if (linkedFiles.length > 0) {
        const confirmed = await this.alerts.confirmV2({
          title: 'Linked files will be moved to vault',
          text: `This note has ${linkedFiles.length} linked files. They will also be moved to the vault. Do you want to continue?`,
        })
        if (!confirmed) {
          return undefined
        }
      }
    }

    await this.moveItemsToVault.execute({ vault, items: [item, ...linkedFiles] })

    return this.items.findSureItem(item.uuid)
  }

  async removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const vault = this.getItemVault(item)
    if (!vault) {
      throw new Error('Cannot find vault to remove item from')
    }

    if (this.isVaultLocked(vault)) {
      throw new Error('Attempting to remove item from locked vault')
    }

    await this.removeItemFromVaultUseCase.execute({ item })
    return this.items.findSureItem(item.uuid)
  }

  async deleteVault(vault: VaultListingInterface): Promise<boolean> {
    if (vault.isSharedVaultListing()) {
      throw new Error('Shared vault must be deleted through SharedVaultService')
    }

    const error = await this.deleteVaultUseCase.execute(vault)

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
    const updatedVault = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(vault, (mutator) => {
      mutator.name = params.name
      mutator.description = params.description
    })

    await this.sync.sync()

    return updatedVault
  }

  async rotateVaultRootKey(vault: VaultListingInterface): Promise<void> {
    if (this.computeVaultLockState(vault) === 'locked') {
      throw new Error('Cannot rotate root key of locked vault')
    }

    await this.rotateVaultKey.execute({
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
    const latestItem = this.items.findItem(item.uuid)
    if (!latestItem) {
      throw new Error('Cannot find latest version of item to get vault for')
    }

    if (!latestItem.key_system_identifier) {
      return undefined
    }

    return this.getVault({ keySystemIdentifier: latestItem.key_system_identifier })
  }

  async changeVaultOptions(dto: ChangeVaultOptionsDTO): Promise<void> {
    if (this.isVaultLocked(dto.vault)) {
      throw new Error('Attempting to change vault options on a locked vault')
    }

    await this.changeVaultKeyOptions.execute(dto)

    if (dto.newPasswordType) {
      await this.notifyEventSync(VaultServiceEvent.VaultRootKeyRotated, { vault: dto.vault })
    }
  }

  public isVaultLocked(vault: VaultListingInterface): boolean {
    return this.lockMap.get(vault.uuid) === true
  }

  public async lockNonPersistentVault(vault: VaultListingInterface): Promise<void> {
    if (vault.keyStorageMode === KeySystemRootKeyStorageMode.Synced) {
      throw new Error('Vault uses synced root key and cannot be locked')
    }

    this.encryption.keys.clearMemoryOfKeysRelatedToVault(vault)

    this.lockMap.set(vault.uuid, true)
    void this.notifyEventSync(VaultServiceEvent.VaultLocked, { vault })
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

    if (this.computeVaultLockState(vault) === 'locked') {
      this.encryption.keys.undoIntakeNonPersistentKeySystemRootKey(vault.systemIdentifier)
      return false
    }

    this.lockMap.set(vault.uuid, false)
    void this.notifyEventSync(VaultServiceEvent.VaultUnlocked, { vault })

    return true
  }

  private recomputeAllVaultsLockingState = async (): Promise<void> => {
    const vaults = this.getVaults()

    for (const vault of vaults) {
      const locked = this.computeVaultLockState(vault) === 'locked'

      if (this.lockMap.get(vault.uuid) !== locked) {
        this.lockMap.set(vault.uuid, locked)

        if (locked) {
          void this.notifyEvent(VaultServiceEvent.VaultLocked, { vault })
        } else {
          void this.notifyEvent(VaultServiceEvent.VaultUnlocked, { vault })
        }
      }
    }
  }

  private computeVaultLockState(vault: VaultListingInterface): 'locked' | 'unlocked' {
    const rootKey = this.encryption.keys.getPrimaryKeySystemRootKey(vault.systemIdentifier)
    if (!rootKey) {
      return 'locked'
    }

    const itemsKey = this.encryption.keys.getPrimaryKeySystemItemsKey(vault.systemIdentifier)
    if (!itemsKey) {
      return 'locked'
    }

    return 'unlocked'
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this.getVaultUseCase as unknown) = undefined
    ;(this.changeVaultKeyOptions as unknown) = undefined
    ;(this.moveItemsToVault as unknown) = undefined
    ;(this.createVault as unknown) = undefined
    ;(this.removeItemFromVaultUseCase as unknown) = undefined
    ;(this.deleteVaultUseCase as unknown) = undefined
    ;(this.rotateVaultKey as unknown) = undefined

    this.lockMap.clear()
  }
}
