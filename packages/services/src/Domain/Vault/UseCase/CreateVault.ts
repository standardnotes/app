import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import { UuidGenerator } from '@standardnotes/utils'
import {
  KeySystemRootKeyParamsInterface,
  KeySystemPasswordType,
  VaultListingContentSpecialized,
  VaultListingInterface,
  KeySystemRootKeyStorageMode,
  FillItemContentSpecialized,
  KeySystemRootKeyInterface,
  EmojiString,
  IconType,
} from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { ContentType } from '@standardnotes/domain-core'
import { EncryptionProviderInterface } from '../../Encryption/EncryptionProviderInterface'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'

export class CreateVault {
  constructor(
    private mutator: MutatorClientInterface,
    private encryption: EncryptionProviderInterface,
    private keys: KeySystemKeyManagerInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(dto: {
    vaultName: string
    vaultDescription?: string
    vaultIcon: IconType | EmojiString
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageMode
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
      vaultIcon: dto.vaultIcon,
      passwordType: dto.userInputtedPassword ? KeySystemPasswordType.UserInputted : KeySystemPasswordType.Randomized,
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
    vaultIcon: IconType | EmojiString
    passwordType: KeySystemPasswordType
    rootKeyParams: KeySystemRootKeyParamsInterface
    storage: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface> {
    const content: VaultListingContentSpecialized = {
      systemIdentifier: dto.keySystemIdentifier,
      rootKeyParams: dto.rootKeyParams,
      keyStorageMode: dto.storage,
      name: dto.vaultName,
      description: dto.vaultDescription,
      iconString: dto.vaultIcon,
    }

    return this.mutator.createItem(ContentType.TYPES.VaultListing, FillItemContentSpecialized(content), true)
  }

  private async createKeySystemItemsKey(keySystemIdentifier: string, rootKeyToken: string): Promise<void> {
    const keySystemItemsKey = this.encryption.createKeySystemItemsKey(
      UuidGenerator.GenerateUuid(),
      keySystemIdentifier,
      undefined,
      rootKeyToken,
    )

    await this.mutator.insertItem(keySystemItemsKey)
  }

  private async createKeySystemRootKey(dto: {
    keySystemIdentifier: string
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageMode
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

    if (dto.storagePreference === KeySystemRootKeyStorageMode.Synced) {
      await this.mutator.insertItem(newRootKey, true)
    } else {
      this.keys.cacheKey(newRootKey, dto.storagePreference)
    }

    return newRootKey
  }
}
