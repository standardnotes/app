import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import {
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
  VaultListingContentSpecialized,
  VaultListingInterface,
  KeySystemRootKeyStorageType,
  FillItemContentSpecialized,
  KeySystemRootKeyInterface,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'

export class CreateVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(dto: {
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageType
  }): Promise<VaultListingInterface> {
    const keySystemIdentifier = UuidGenerator.GenerateUuid()

    await this.createKeySystemItemsKey(keySystemIdentifier)

    const rootKey = await this.createKeySystemRootKey({
      keySystemIdentifier,
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
      userInputtedPassword: dto.userInputtedPassword,
    })

    const vaultListing = await this.createVaultListing({
      keySystemIdentifier,
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
      passwordType: dto.userInputtedPassword
        ? KeySystemRootKeyPasswordType.UserInputted
        : KeySystemRootKeyPasswordType.Randomized,
      rootKeyParams: rootKey.keyParams,
      storage: dto.storagePreference,
    })

    await this.sync.sync()

    return vaultListing
  }

  private async createVaultListing(dto: {
    keySystemIdentifier: string
    vaultName: string
    vaultDescription?: string
    passwordType: KeySystemRootKeyPasswordType
    rootKeyParams: KeySystemRootKeyParamsInterface
    storage: KeySystemRootKeyStorageType
  }): Promise<VaultListingInterface> {
    const content: VaultListingContentSpecialized = {
      systemIdentifier: dto.keySystemIdentifier,
      rootKeyPasswordType: dto.passwordType,
      rootKeyParams: dto.rootKeyParams,
      rootKeyStorage: dto.storage,
      name: dto.vaultName,
      description: dto.vaultDescription,
    }

    return this.items.createItem(ContentType.VaultListing, FillItemContentSpecialized(content), true)
  }

  private async createKeySystemItemsKey(keySystemIdentifier: string): Promise<void> {
    const keySystemItemsKey = this.encryption.createKeySystemItemsKey(
      UuidGenerator.GenerateUuid(),
      keySystemIdentifier,
      undefined,
    )

    await this.items.insertItem(keySystemItemsKey)
  }

  private async createKeySystemRootKey(dto: {
    keySystemIdentifier: string
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
  }): Promise<KeySystemRootKeyInterface> {
    if (dto.userInputtedPassword) {
      const newRootKey = this.encryption.createUserInputtedKeySystemRootKey({
        systemIdentifier: dto.keySystemIdentifier,
        systemName: dto.vaultName,
        userInputtedPassword: dto.userInputtedPassword,
        systemDescription: dto.vaultDescription,
      })

      await this.items.insertItem(newRootKey, true)

      return newRootKey
    }

    const newRootKey = this.encryption.createRandomizedKeySystemRootKey({
      systemIdentifier: dto.keySystemIdentifier,
      systemName: dto.vaultName,
      systemDescription: dto.vaultDescription,
    })

    await this.items.insertItem(newRootKey, true)

    return newRootKey
  }
}
