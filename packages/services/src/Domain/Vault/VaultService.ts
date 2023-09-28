import { ValidateVaultPassword } from './../VaultLock/UseCase/ValidateVaultPassword'
import { IsVaultOwner } from './../VaultUser/UseCase/IsVaultOwner'
import { SendVaultDataChangedMessage } from './../SharedVaults/UseCase/SendVaultDataChangedMessage'
import { isClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  EmojiString,
  IconType,
  KeySystemIdentifier,
  KeySystemRootKeyStorageMode,
  SNTag,
  SharedVaultListingInterface,
  VaultListingInterface,
  VaultListingMutator,
  isFile,
  isNote,
  isTag,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { ChangeVaultKeyOptionsDTO } from './UseCase/ChangeVaultKeyOptionsDTO'
import { VaultServiceEvent, VaultServiceEventPayload } from './VaultServiceEvent'
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
import { GetVaults } from './UseCase/GetVaults'
import { VaultLockServiceInterface } from '../VaultLock/VaultLockServiceInterface'
import { Result } from '@standardnotes/domain-core'
import { AuthorizeVaultDeletion } from './UseCase/AuthorizeVaultDeletion'

export class VaultService
  extends AbstractService<VaultServiceEvent, VaultServiceEventPayload[VaultServiceEvent]>
  implements VaultServiceInterface
{
  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private vaultLocks: VaultLockServiceInterface,
    private alerts: AlertService,
    private _getVault: GetVault,
    private _getVaults: GetVaults,
    private _changeVaultKeyOptions: ChangeVaultKeyOptions,
    private _moveItemsToVault: MoveItemsToVault,
    private _createVault: CreateVault,
    private _removeItemFromVault: RemoveItemFromVault,
    private _deleteVault: DeleteVault,
    private _rotateVaultKey: RotateVaultKey,
    private _sendVaultDataChangeMessage: SendVaultDataChangedMessage,
    private _isVaultOwner: IsVaultOwner,
    private _validateVaultPassword: ValidateVaultPassword,
    private _authorizeVaultDeletion: AuthorizeVaultDeletion,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.vaultLocks as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this._getVault as unknown) = undefined
    ;(this._getVaults as unknown) = undefined
    ;(this._changeVaultKeyOptions as unknown) = undefined
    ;(this._moveItemsToVault as unknown) = undefined
    ;(this._createVault as unknown) = undefined
    ;(this._removeItemFromVault as unknown) = undefined
    ;(this._deleteVault as unknown) = undefined
    ;(this._rotateVaultKey as unknown) = undefined
  }

  getVaults(): VaultListingInterface[] {
    return this._getVaults.execute().getValue()
  }

  getVault(dto: { keySystemIdentifier: KeySystemIdentifier }): Result<VaultListingInterface> {
    return this._getVault.execute(dto)
  }

  async createRandomizedVault(dto: {
    name: string
    description?: string
    iconString: IconType | EmojiString
  }): Promise<VaultListingInterface> {
    return this.createVaultWithParameters({
      name: dto.name,
      description: dto.description,
      iconString: dto.iconString,
      userInputtedPassword: undefined,
      storagePreference: KeySystemRootKeyStorageMode.Synced,
    })
  }

  async createUserInputtedPasswordVault(dto: {
    name: string
    description?: string
    iconString: IconType | EmojiString
    userInputtedPassword: string
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface> {
    return this.createVaultWithParameters(dto)
  }

  private async createVaultWithParameters(dto: {
    name: string
    description?: string
    iconString: IconType | EmojiString
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface> {
    const result = await this._createVault.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      vaultIcon: dto.iconString,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference,
    })

    return result
  }

  async moveItemToVault(
    vault: VaultListingInterface,
    item: DecryptedItemInterface,
  ): Promise<Result<DecryptedItemInterface>> {
    if (this.vaultLocks.isVaultLocked(vault)) {
      throw new Error('Attempting to add item to locked vault')
    }

    if (isNote(item) || isFile(item)) {
      const linkedFiles = this.items.getItemLinkedFiles(item)
      const linkedNotes = this.items.getItemLinkedNotes(item)
      const linkedTags = this.items.getUnsortedTagsForItem(item)

      const areAnyLinkedItemsInOtherVaults = [...linkedFiles, ...linkedNotes, ...linkedTags].some((linkedItem) => {
        return linkedItem.key_system_identifier !== vault.systemIdentifier
      })

      if (areAnyLinkedItemsInOtherVaults) {
        const reason =
          'This item is linked to other items that are not in the same vault. Please move those items to this vault first.'
        this.alerts
          .alertV2({
            title: 'Cannot move item to vault',
            text: reason,
          })
          .catch(console.error)
        return Result.fail(reason)
      }
    }

    let moveableSubtags: SNTag[] = []
    if (isTag(item)) {
      const deepSubtags = this.items.getDeepTagChildren(item)
      const anySubtagIsInOtherVault = deepSubtags.some((subtag) => {
        return subtag.key_system_identifier && subtag.key_system_identifier !== vault.systemIdentifier
      })
      if (anySubtagIsInOtherVault) {
        const reason =
          'One or more subtags are in other vaults. Please remove those subtags from the vaults or move them to this vault first.'
        this.alerts
          .alertV2({
            title: 'Cannot move item to vault',
            text: reason,
          })
          .catch(console.error)
        return Result.fail(reason)
      }
      moveableSubtags = deepSubtags
    }

    await this._moveItemsToVault.execute({ vault, items: [item, ...moveableSubtags] })

    return Result.ok(this.items.findSureItem(item.uuid))
  }

  async removeItemFromVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const vault = this.getItemVault(item)
    if (!vault) {
      throw new Error('Cannot find vault to remove item from')
    }

    if (this.vaultLocks.isVaultLocked(vault)) {
      throw new Error('Attempting to remove item from locked vault')
    }

    if (isTag(item)) {
      const deepSubtags = this.items.getDeepTagChildren(item)
      for (const subtag of deepSubtags) {
        await this._removeItemFromVault.execute({ item: subtag })
      }
    }

    await this._removeItemFromVault.execute({ item })
    return this.items.findSureItem(item.uuid)
  }

  authorizeVaultDeletion(vault: VaultListingInterface): Promise<Result<boolean>> {
    return this._authorizeVaultDeletion.execute(vault)
  }

  async deleteVault(vault: VaultListingInterface): Promise<boolean> {
    if (vault.isSharedVaultListing()) {
      throw new Error('Shared vault must be deleted through SharedVaultService')
    }

    const error = await this._deleteVault.execute(vault)

    if (isClientDisplayableError(error)) {
      return false
    }

    await this.sync.sync()
    return true
  }

  async changeVaultMetadata(
    vault: VaultListingInterface,
    params: { name: string; description?: string; iconString: IconType | EmojiString },
  ): Promise<VaultListingInterface> {
    const updatedVault = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(vault, (mutator) => {
      mutator.name = params.name
      mutator.description = params.description
      mutator.iconString = params.iconString
    })

    await this.sync.sync()

    if (updatedVault.isSharedVaultListing()) {
      await this._sendVaultDataChangeMessage.execute({
        vault: updatedVault,
      })
    }

    return updatedVault
  }

  async rotateVaultRootKey(vault: VaultListingInterface, vaultPassword?: string): Promise<void> {
    if (this.vaultLocks.isVaultLocked(vault)) {
      throw new Error('Cannot rotate root key of locked vault')
    }

    await this._rotateVaultKey.execute({
      vault,
      userInputtedPassword: vaultPassword,
    })

    await this.sync.sync()
  }

  isItemInVault(item: DecryptedItemInterface): boolean {
    return item.key_system_identifier !== undefined
  }

  getItemVault(item: DecryptedItemInterface): VaultListingInterface | undefined {
    const latestItem = this.items.findItem(item.uuid)

    if (this.items.isTemplateItem(item)) {
      return undefined
    }

    if (!latestItem) {
      throw new Error('Cannot find latest version of item to get vault for')
    }

    if (!latestItem.key_system_identifier) {
      return undefined
    }

    const vault = this.getVault({ keySystemIdentifier: latestItem.key_system_identifier })
    if (vault.isFailed()) {
      throw new Error('Cannot find vault for item')
    }

    return vault.getValue()
  }

  async changeVaultKeyOptions(dto: ChangeVaultKeyOptionsDTO): Promise<Result<void>> {
    if (this.vaultLocks.isVaultLocked(dto.vault)) {
      throw new Error('Attempting to change vault options on a locked vault')
    }

    if (!this._isVaultOwner.execute(dto.vault).getValue()) {
      throw new Error('Third party vault options should be changed via changeThirdPartyVaultStorageOptions')
    }

    const result = await this._changeVaultKeyOptions.execute(dto)

    return result
  }

  async changeThirdPartyVaultStorageOptions(dto: {
    vault: SharedVaultListingInterface
    newStorageMode: KeySystemRootKeyStorageMode | undefined
    vaultPassword: string
  }): Promise<Result<void>> {
    if (this.vaultLocks.isVaultLocked(dto.vault)) {
      throw new Error('Attempting to change vault options on a locked vault')
    }

    if (this._isVaultOwner.execute(dto.vault).getValue()) {
      throw new Error('First party vault options should be changed via changeVaultKeyOptions')
    }

    const validPassword = this._validateVaultPassword.execute(dto.vault, dto.vaultPassword).getValue()
    if (!validPassword) {
      return Result.fail('Invalid vault password')
    }

    const result = await this._changeVaultKeyOptions.execute({
      vault: dto.vault,
      newStorageMode: dto.newStorageMode,
      newPasswordOptions: undefined,
    })

    return result
  }
}
