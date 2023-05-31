import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { GroupsServerInterface } from '@standardnotes/api'
import { CreateVaultKeyUseCase } from './CreateVaultKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import {
  VaultInterface,
  VaultInterfaceFromServerHash,
  VaultItemsKeyInterface,
  VaultKeyCopyContentSpecialized,
} from '@standardnotes/models'
import { VaultStorageServiceInterface } from '../../VaultStorage/VaultStorageServiceInterface'

export class CreateVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private vaultsServer: GroupsServerInterface,
    private vaultStorage: VaultStorageServiceInterface,
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
      return this.createOnlineVault({
        vaultUuid,
        vaultKeyContent,
        vaultItemsKey,
      })
    } else {
      return this.createOfflineVault({
        vaultUuid,
        vaultKeyContent,
        vaultItemsKey,
      })
    }
  }

  private async createOnlineVault(params: {
    vaultSystemIdentifier: string
    vaultKeyContent: VaultKeyCopyContentSpecialized
    vaultItemsKey: VaultItemsKeyInterface
  }): Promise<VaultInterface | ClientDisplayableError> {
    const response = await this.vaultsServer.createVault({
      vaultSystemIdentifier: params.vaultUuid,
      vaultKeyTimestamp: params.vaultKeyContent.keyTimestamp,
      specifiedItemsKeyUuid: params.vaultItemsKey.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    await this.items.insertItem(params.vaultItemsKey)

    const vault = VaultInterfaceFromServerHash(response.data.vault)

    this.vaultStorage.setVault(vault)

    return vault
  }

  private async createOfflineVault(params: {
    vaultSystemIdentifier: string
    vaultKeyContent: VaultKeyCopyContentSpecialized
    vaultItemsKey: VaultItemsKeyInterface
  }): Promise<VaultInterface> {
    await this.items.insertItem(params.vaultItemsKey)

    const vault: VaultInterface = {
      uuid: params.vaultUuid,
      specifiedItemsKeyUuid: params.vaultItemsKey.uuid,
      vaultKeyTimestamp: params.vaultKeyContent.keyTimestamp,
    }

    this.vaultStorage.setVault(vault)

    return vault
  }
}
