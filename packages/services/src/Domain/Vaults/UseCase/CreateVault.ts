import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError } from '@standardnotes/responses'
import { CreateVaultKeyUseCase } from './CreateVaultKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class CreateVaultUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(dto: { vaultName: string; vaultDescription?: string }): Promise<string | ClientDisplayableError> {
    const vaultSystemIdentifier = UuidGenerator.GenerateUuid()
    const vaultItemsKey = this.encryption.createVaultItemsKey(UuidGenerator.GenerateUuid(), vaultSystemIdentifier)
    const vaultKeyContent = this.encryption.createVaultKeyContent({ vaultSystemIdentifier, vaultName: dto.vaultName })

    const createVaultKey = new CreateVaultKeyUseCase(this.items)
    await createVaultKey.execute({
      ...vaultKeyContent,
      vaultDescription: dto.vaultDescription,
    })

    await this.items.insertItem(vaultItemsKey)

    return vaultSystemIdentifier
  }
}
