import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class CreateVaultUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(dto: {
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
  }): Promise<string | ClientDisplayableError> {
    const keySystemIdentifier = UuidGenerator.GenerateUuid()
    const keySystemItemsKey = this.encryption.createKeySystemItemsKey(
      UuidGenerator.GenerateUuid(),
      keySystemIdentifier,
      undefined,
    )

    if (dto.userInputtedPassword) {
      const newRootKey = this.encryption.createUserInputtedKeySystemRootKey({
        systemIdentifier: keySystemIdentifier,
        systemName: dto.vaultName,
        userInputtedPassword: dto.userInputtedPassword,
        systemDescription: dto.vaultDescription,
      })

      await this.items.insertItem(newRootKey, true)
    } else {
      const newRootKey = this.encryption.createRandomizedKeySystemRootKey({
        systemIdentifier: keySystemIdentifier,
        systemName: dto.vaultName,
        systemDescription: dto.vaultDescription,
      })

      await this.items.insertItem(newRootKey, true)
    }

    await this.items.insertItem(keySystemItemsKey)

    return keySystemIdentifier
  }
}
