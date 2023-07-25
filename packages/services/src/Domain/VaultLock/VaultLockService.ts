import { GetVaults } from '../Vault/UseCase/GetVaults'
import { KeySystemRootKeyPasswordType, KeySystemRootKeyStorageMode, VaultListingInterface } from '@standardnotes/models'
import { VaultLockServiceInterface } from './VaultLockServiceInterface'
import { VaultLockServiceEvent, VaultLockServiceEventPayload } from './VaultLockServiceEvent'
import { AbstractService } from '../Service/AbstractService'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { ContentType } from '@standardnotes/domain-core'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'
import { KeySystemKeyManagerInterface } from '../KeySystem/KeySystemKeyManagerInterface'

export class VaultLockService
  extends AbstractService<VaultLockServiceEvent, VaultLockServiceEventPayload[VaultLockServiceEvent]>
  implements VaultLockServiceInterface
{
  private lockMap = new Map<VaultListingInterface['uuid'], boolean>()

  constructor(
    items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private keys: KeySystemKeyManagerInterface,
    private _getVaults: GetVaults,
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

  override deinit(): void {
    super.deinit()
    ;(this.encryption as unknown) = undefined
    ;(this.keys as unknown) = undefined
    ;(this._getVaults as unknown) = undefined

    this.lockMap.clear()
  }

  public getLockedvaults(): VaultListingInterface[] {
    const vaults = this._getVaults.execute().getValue()
    return vaults.filter((vault) => this.isVaultLocked(vault))
  }

  public isVaultLocked(vault: VaultListingInterface): boolean {
    return this.lockMap.get(vault.uuid) === true
  }

  public isVaultLockable(vault: VaultListingInterface): boolean {
    return vault.keyPasswordType === KeySystemRootKeyPasswordType.UserInputted
  }

  public lockNonPersistentVault(vault: VaultListingInterface): void {
    if (vault.keyStorageMode === KeySystemRootKeyStorageMode.Synced) {
      throw new Error('Vault uses synced key storage and cannot be locked')
    }

    if (vault.keyPasswordType !== KeySystemRootKeyPasswordType.UserInputted) {
      throw new Error('Vault uses randomized password and cannot be locked')
    }

    this.keys.clearMemoryOfKeysRelatedToVault(vault)

    this.lockMap.set(vault.uuid, true)

    void this.notifyEventSync(VaultLockServiceEvent.VaultLocked, { vault })
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

    this.keys.intakeNonPersistentKeySystemRootKey(derivedRootKey, vault.keyStorageMode)

    await this.encryption.decryptErroredPayloads()

    if (this.computeVaultLockState(vault) === 'locked') {
      this.keys.undoIntakeNonPersistentKeySystemRootKey(vault.systemIdentifier)
      return false
    }

    this.lockMap.set(vault.uuid, false)
    void this.notifyEventSync(VaultLockServiceEvent.VaultUnlocked, { vault })

    return true
  }

  private recomputeAllVaultsLockingState = async (): Promise<void> => {
    const vaults = this._getVaults.execute().getValue()

    for (const vault of vaults) {
      const locked = this.computeVaultLockState(vault) === 'locked'

      if (this.lockMap.get(vault.uuid) !== locked) {
        this.lockMap.set(vault.uuid, locked)

        if (locked) {
          void this.notifyEvent(VaultLockServiceEvent.VaultLocked, { vault })
        } else {
          void this.notifyEvent(VaultLockServiceEvent.VaultUnlocked, { vault })
        }
      }
    }
  }

  private computeVaultLockState(vault: VaultListingInterface): 'locked' | 'unlocked' {
    const rootKey = this.keys.getPrimaryKeySystemRootKey(vault.systemIdentifier)
    if (!rootKey) {
      return 'locked'
    }

    const itemsKey = this.keys.getPrimaryKeySystemItemsKey(vault.systemIdentifier)
    if (!itemsKey) {
      return 'locked'
    }

    return 'unlocked'
  }
}
