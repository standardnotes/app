import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError, VaultServerHash, isErrorResponse } from '@standardnotes/responses'
import { VaultsServerInterface } from '@standardnotes/api'
import { CreateVaultKeyUseCase } from './CreateVaultKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class CreateVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private vaultsServer: VaultsServerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(dto: {
    vaultName?: string
    vaultDescription?: string
  }): Promise<VaultServerHash | ClientDisplayableError> {
    const vaultUuid = UuidGenerator.GenerateUuid()
    const vaultItemsKey = this.encryption.createVaultItemsKey(UuidGenerator.GenerateUuid(), vaultUuid)

    const vaultKeyContent = this.encryption.createVaultKeyData(vaultUuid)
    const createVaultKey = new CreateVaultKeyUseCase(this.items)
    await createVaultKey.execute({
      ...vaultKeyContent,
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
    })

    const response = await this.vaultsServer.createVault({
      vaultUuid,
      vaultKeyTimestamp: vaultKeyContent.keyTimestamp,
      specifiedItemsKeyUuid: vaultItemsKey.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const { vault } = response.data

    await this.items.insertItem(vaultItemsKey)

    return vault
  }
}
