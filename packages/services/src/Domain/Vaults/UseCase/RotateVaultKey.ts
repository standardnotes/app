import { UuidGenerator, assert } from '@standardnotes/utils'
import { EncryptionProviderInterface, KeySystemKeyManagerInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import {
  KeySystemIdentifier,
  KeySystemRootKeyInterface,
  KeySystemRootKeyPasswordType,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class RotateVaultKey {
  constructor(
    private mutator: MutatorClientInterface,
    private encryption: EncryptionProviderInterface,
    private keys: KeySystemKeyManagerInterface,
  ) {}

  async execute(params: {
    vault: VaultListingInterface
    sharedVaultUuid: string | undefined
    userInputtedPassword: string | undefined
  }): Promise<undefined | ClientDisplayableError[]> {
    const currentRootKey = this.keys.getPrimaryKeySystemRootKey(params.vault.systemIdentifier)
    if (!currentRootKey) {
      throw new Error('Cannot rotate key system root key; key system root key not found')
    }

    let newRootKey: KeySystemRootKeyInterface | undefined

    if (currentRootKey.keyParams.passwordType === KeySystemRootKeyPasswordType.UserInputted) {
      if (!params.userInputtedPassword) {
        throw new Error('Cannot rotate key system root key; user inputted password required')
      }

      newRootKey = this.encryption.createUserInputtedKeySystemRootKey({
        systemIdentifier: params.vault.systemIdentifier,
        userInputtedPassword: params.userInputtedPassword,
      })
    } else if (currentRootKey.keyParams.passwordType === KeySystemRootKeyPasswordType.Randomized) {
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
      this.keys.intakeNonPersistentKeySystemRootKey(newRootKey, params.vault.keyStorageMode)
    }

    await this.mutator.changeItem<VaultListingMutator>(params.vault, (mutator) => {
      assert(newRootKey)
      mutator.rootKeyParams = newRootKey.keyParams
    })

    const errors: ClientDisplayableError[] = []

    const updateKeySystemItemsKeyResult = await this.createNewKeySystemItemsKey({
      keySystemIdentifier: params.vault.systemIdentifier,
      sharedVaultUuid: params.sharedVaultUuid,
      rootKeyToken: newRootKey.token,
    })

    if (isClientDisplayableError(updateKeySystemItemsKeyResult)) {
      errors.push(updateKeySystemItemsKeyResult)
    }

    await this.encryption.reencryptKeySystemItemsKeysForVault(params.vault.systemIdentifier)

    return errors
  }

  private async createNewKeySystemItemsKey(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string | undefined
    rootKeyToken: string
  }): Promise<ClientDisplayableError | void> {
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
