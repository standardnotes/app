import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { VaultsServerInterface } from '@standardnotes/api'
import { CreateVaultKeyUseCase } from './CreateVaultKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { VaultInterface, VaultInterfaceFromServerHash } from '@standardnotes/models'

export class CreateVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private vaultsServer: VaultsServerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(dto: {
    online: boolean
    vaultName?: string
    vaultDescription?: string
  }): Promise<VaultInterface | ClientDisplayableError> {
    const vaultUuid = UuidGenerator.GenerateUuid()
    const vaultItemsKey = this.encryption.createVaultItemsKey(UuidGenerator.GenerateUuid(), vaultUuid)
    const vaultKeyContent = this.encryption.createVaultKeyData(vaultUuid)
    const createVaultKey = new CreateVaultKeyUseCase(this.items)
    await createVaultKey.execute({
      ...vaultKeyContent,
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
    })

    if (dto.online) {
      const response = await this.vaultsServer.createVault({
        vaultUuid,
        vaultKeyTimestamp: vaultKeyContent.keyTimestamp,
        specifiedItemsKeyUuid: vaultItemsKey.uuid,
      })

      if (isErrorResponse(response)) {
        return ClientDisplayableError.FromError(response.data.error)
      }

      await this.items.insertItem(vaultItemsKey)

      return VaultInterfaceFromServerHash(response.data.vault)
    } else {
      return {
        uuid: vaultUuid,
        specifiedItemsKeyUuid: vaultItemsKey.uuid,
        vaultKeyTimestamp: vaultKeyContent.keyTimestamp,
      }
    }
  }
}
