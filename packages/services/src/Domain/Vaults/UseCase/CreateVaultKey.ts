import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'
import { FillItemContent, VaultKeyContent, VaultKeyContentSpecialized, VaultKeyInterface } from '@standardnotes/models'

export class CreateVaultKeyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(content: VaultKeyContentSpecialized): Promise<VaultKeyInterface> {
    const newVaultKey = await this.items.createItem<VaultKeyInterface>(
      ContentType.VaultKey,
      FillItemContent<VaultKeyContent>(content),
      true,
    )

    return newVaultKey
  }
}
