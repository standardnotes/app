import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'
import { FillItemContent, VaultKeyCopyContent, VaultKeyCopyContentSpecialized, VaultKeyCopyInterface } from '@standardnotes/models'

export class CreateVaultKeyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(content: VaultKeyCopyContentSpecialized): Promise<VaultKeyCopyInterface> {
    const newVaultKey = await this.items.createItem<VaultKeyCopyInterface>(
      ContentType.VaultKeyCopy,
      FillItemContent<VaultKeyContent>(content),
      true,
    )

    return newVaultKey
  }
}
