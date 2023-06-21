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

    const rootKey = await this.createKeySystemRootKey({
      keySystemIdentifier,
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference,
    })

    await this.createKeySystemItemsKey(keySystemIdentifier, rootKey.token)

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

  private async createKeySystemItemsKey(keySystemIdentifier: string, rootKeyToken: string): Promise<void> {
    const keySystemItemsKey = this.encryption.createKeySystemItemsKey(
      UuidGenerator.GenerateUuid(),
      keySystemIdentifier,
      undefined,
      rootKeyToken,
    )

    await this.items.insertItem(keySystemItemsKey)
  }

  private async createKeySystemRootKey(dto: {
    keySystemIdentifier: string
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageType
  }): Promise<KeySystemRootKeyInterface> {
    let newRootKey: KeySystemRootKeyInterface | undefined

    if (dto.userInputtedPassword) {
      newRootKey = this.encryption.createUserInputtedKeySystemRootKey({
        systemIdentifier: dto.keySystemIdentifier,
        userInputtedPassword: dto.userInputtedPassword,
      })
    } else {
      newRootKey = this.encryption.createRandomizedKeySystemRootKey({
        systemIdentifier: dto.keySystemIdentifier,
      })
    }

    if (dto.storagePreference === KeySystemRootKeyStorageType.Synced) {
      await this.items.insertItem(newRootKey, true)
    } else {
      this.encryption.keys.intakeNonPersistentKeySystemRootKey(newRootKey, dto.storagePreference)
    }

    return newRootKey
  }
}
