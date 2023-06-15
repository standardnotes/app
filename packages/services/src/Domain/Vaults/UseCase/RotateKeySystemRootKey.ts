import { UuidGenerator } from '@standardnotes/utils'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { KeySystemIdentifier, KeySystemRootKeyPasswordType } from '@standardnotes/models'

export class RotateKeySystemRootKeyUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string | undefined
    userInputtedPassword: string | undefined
  }): Promise<undefined | ClientDisplayableError[]> {
    const currentRootKey = this.items.getPrimaryKeySystemRootKey(params.keySystemIdentifier)
    if (!currentRootKey) {
      throw new Error('Cannot rotate key system root key; key system root key not found')
    }

    if (currentRootKey.keyParams.passwordType === KeySystemRootKeyPasswordType.UserInputted) {
      if (!params.userInputtedPassword) {
        throw new Error('Cannot rotate key system root key; user inputted password required')
      }

      const newRootKey = this.encryption.createUserInputtedKeySystemRootKey({
        systemIdentifier: params.keySystemIdentifier,
        systemName: currentRootKey.systemName,
        userInputtedPassword: params.userInputtedPassword,
      })

      await this.items.insertItem(newRootKey, true)
    } else if (currentRootKey.keyParams.passwordType === KeySystemRootKeyPasswordType.Randomized) {
      const newRootKey = this.encryption.createRandomizedKeySystemRootKey({
        systemIdentifier: params.keySystemIdentifier,
        systemName: currentRootKey.systemName,
      })

      await this.items.insertItem(newRootKey, true)
    }

    const errors: ClientDisplayableError[] = []

    const updateKeySystemItemsKeyResult = await this.createNewKeySystemItemsKey({
      keySystemIdentifier: params.keySystemIdentifier,
      sharedVaultUuid: params.sharedVaultUuid,
    })

    if (isClientDisplayableError(updateKeySystemItemsKeyResult)) {
      errors.push(updateKeySystemItemsKeyResult)
    }

    await this.encryption.reencryptKeySystemItemsKeysForVault(params.keySystemIdentifier)

    return errors
  }

  private async createNewKeySystemItemsKey(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string | undefined
  }): Promise<ClientDisplayableError | void> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createKeySystemItemsKey(
      newItemsKeyUuid,
      params.keySystemIdentifier,
      params.sharedVaultUuid,
    )
    await this.items.insertItem(newItemsKey)
  }
}
