import { IsVaultOwner } from './../../VaultUser/UseCase/IsVaultOwner'
import { NotifyVaultUsersOfKeyRotation } from './../../SharedVaults/UseCase/NotifyVaultUsersOfKeyRotation'
import { UuidGenerator, assert } from '@standardnotes/utils'
import {
  KeySystemIdentifier,
  KeySystemRootKeyInterface,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { EncryptionProviderInterface } from '../../Encryption/EncryptionProviderInterface'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class RotateVaultKey implements UseCaseInterface<void> {
  constructor(
    private mutator: MutatorClientInterface,
    private encryption: EncryptionProviderInterface,
    private keys: KeySystemKeyManagerInterface,
    private _notifyVaultUsersOfKeyRotation: NotifyVaultUsersOfKeyRotation,
    private _isVaultOwner: IsVaultOwner,
  ) {}

  async execute(params: {
    vault: VaultListingInterface
    userInputtedPassword: string | undefined
  }): Promise<Result<void>> {
    const newRootKey = await this.updateRootKeyparams(params)

    await this.createNewKeySystemItemsKey({
      keySystemIdentifier: params.vault.systemIdentifier,
      sharedVaultUuid: params.vault.isSharedVaultListing() ? params.vault.sharing.sharedVaultUuid : undefined,
      rootKeyToken: newRootKey.token,
    })

    await this.keys.queueVaultItemsKeysForReencryption(params.vault.systemIdentifier)

    const shareResult = await this.shareNewKeyWithMembers({
      vault: params.vault,
      newRootKey,
    })

    if (shareResult.isFailed()) {
      return Result.fail(shareResult.getError())
    }

    return Result.ok()
  }

  private async shareNewKeyWithMembers(params: {
    vault: VaultListingInterface
    newRootKey: KeySystemRootKeyInterface
  }): Promise<Result<void>> {
    if (!params.vault.isSharedVaultListing()) {
      return Result.ok()
    }

    const isOwner = this._isVaultOwner.execute({ sharedVault: params.vault }).getValue()

    if (!isOwner) {
      return Result.ok()
    }

    const result = await this._notifyVaultUsersOfKeyRotation.execute({
      sharedVault: params.vault,
    })

    return result
  }

  private async updateRootKeyparams(params: {
    vault: VaultListingInterface
    userInputtedPassword: string | undefined
  }): Promise<KeySystemRootKeyInterface> {
    const currentRootKey = this.keys.getPrimaryKeySystemRootKey(params.vault.systemIdentifier)
    if (!currentRootKey) {
      throw new Error('Cannot rotate key system root key; key system root key not found')
    }

    let newRootKey: KeySystemRootKeyInterface | undefined

    if (params.userInputtedPassword) {
      newRootKey = this.encryption.createUserInputtedKeySystemRootKey({
        systemIdentifier: params.vault.systemIdentifier,
        userInputtedPassword: params.userInputtedPassword,
      })
    } else {
      newRootKey = this.encryption.createRandomizedKeySystemRootKey({
        systemIdentifier: params.vault.systemIdentifier,
      })
    }

    if (!newRootKey) {
      throw new Error('Cannot rotate key system root key; new root key not created')
    }

    if (params.vault.keyStorageMode === KeySystemRootKeyStorageMode.Synced) {
      await this.mutator.insertItem(newRootKey, true)
    } else {
      this.keys.cacheKey(newRootKey, params.vault.keyStorageMode)
    }

    await this.mutator.changeItem<VaultListingMutator>(params.vault, (mutator) => {
      assert(newRootKey)
      mutator.rootKeyParams = newRootKey.keyParams
    })

    return newRootKey
  }

  private async createNewKeySystemItemsKey(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string | undefined
    rootKeyToken: string
  }): Promise<void> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createKeySystemItemsKey(
      newItemsKeyUuid,
      params.keySystemIdentifier,
      params.sharedVaultUuid,
      params.rootKeyToken,
    )
    await this.mutator.insertItem(newItemsKey)
  }
}
