import { UuidGenerator } from '@standardnotes/utils'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { GroupsServerInterface } from '@standardnotes/api'
import { UpdateServerVaultUseCase } from './UpdateServerVault'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { VaultStorageServiceInterface } from '../../VaultStorage/VaultStorageServiceInterface'
import { ChangeVaultKeyDataUseCase } from './ChangeVaultKeyData'

export class RotateVaultKeyUseCase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private vaultsServer: GroupsServerInterface,
    private vaultStorage: VaultStorageServiceInterface,
  ) {}

  async execute(params: { vaultSystemIdentifier: string; online: boolean }): Promise<undefined | ClientDisplayableError[]> {
    const vaultKey = this.items.getPrimarySyncedVaultKeyCopy(params.vaultUuid)
    if (!vaultKey) {
      throw new Error('Cannot rotate vault key; vault key not found')
    }

    const newVaultContent = this.encryption.createVaultKeyData(params.vaultUuid)

    const errors: ClientDisplayableError[] = []

    const updateVaultVaultItemsKeyResult = await this.createNewVaultItemsKey({
      online: params.online,
      vaultSystemIdentifier: params.vaultUuid,
      vaultKeyTimestamp: newVaultContent.keyTimestamp,
    })

    if (isClientDisplayableError(updateVaultVaultItemsKeyResult)) {
      errors.push(updateVaultVaultItemsKeyResult)
    }

    await this.encryption.reencryptVaultItemsKeysForVault(params.vaultUuid)

    const changeVaultDataUseCase = new ChangeVaultKeyDataUseCase(this.items, this.encryption)
    await changeVaultDataUseCase.execute({
      vaultSystemIdentifier: params.vaultUuid,
      newVaultData: newVaultContent,
    })

    return errors
  }

  private async createNewVaultItemsKey(params: {
    online: boolean
    vaultSystemIdentifier: string
    vaultKeyTimestamp: number
  }): Promise<ClientDisplayableError | void> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createVaultItemsKey(newItemsKeyUuid, params.vaultUuid)
    await this.items.insertItem(newItemsKey)

    if (params.online) {
      const updateVaultUseCase = new UpdateServerVaultUseCase(this.vaultsServer)
      const updateResult = await updateVaultUseCase.execute({
        vaultSystemIdentifier: params.vaultUuid,
        vaultKeyTimestamp: params.vaultKeyTimestamp,
        specifiedItemsKeyUuid: newItemsKey.uuid,
      })

      if (isClientDisplayableError(updateResult)) {
        return updateResult
      }

      this.vaultStorage.setVault(updateResult)
    } else {
      this.vaultStorage.setVault({
        uuid: params.vaultUuid,
        vaultKeyTimestamp: params.vaultKeyTimestamp,
        specifiedItemsKeyUuid: newItemsKey.uuid,
      })
    }
  }
}
