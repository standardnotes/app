import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError } from '@standardnotes/responses'
import { CreateKeySystemRootKeyUseCase } from './CreateKeySystemRootKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class CreateVaultUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(dto: { vaultName: string; vaultDescription?: string }): Promise<string | ClientDisplayableError> {
    const keySystemIdentifier = UuidGenerator.GenerateUuid()
    const keySystemItemsKey = this.encryption.createKeySystemItemsKey(UuidGenerator.GenerateUuid(), keySystemIdentifier)

    const createKeySystemRootKey = new CreateKeySystemRootKeyUseCase(this.items)
    const keySystemRootKeyContent = this.encryption.createKeySystemRootKeyContent({
      systemIdentifier: keySystemIdentifier,
      systemName: dto.vaultName,
    })
    await createKeySystemRootKey.execute({
      ...keySystemRootKeyContent,
      systemDescription: dto.vaultDescription,
    })

    await this.items.insertItem(keySystemItemsKey)

    return keySystemIdentifier
  }
}
