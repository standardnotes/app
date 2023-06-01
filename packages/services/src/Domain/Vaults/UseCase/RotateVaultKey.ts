import { UuidGenerator } from '@standardnotes/utils'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { CreateVaultKeyUseCase } from './CreateVaultKey'

export class RotateVaultKeyUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(params: { vaultSystemIdentifier: string }): Promise<undefined | ClientDisplayableError[]> {
    const vaultKey = this.items.getPrimarySyncedVaultKeyCopy(params.vaultSystemIdentifier)
    if (!vaultKey) {
      throw new Error('Cannot rotate vault key; vault key not found')
    }

    const newVaultKeyContent = this.encryption.createVaultKeyContent({
      vaultSystemIdentifier: params.vaultSystemIdentifier,
      vaultName: vaultKey.vaultName,
    })
    const createVaultKey = new CreateVaultKeyUseCase(this.items)
    await createVaultKey.execute(newVaultKeyContent)

    const errors: ClientDisplayableError[] = []

    const updateVaultVaultItemsKeyResult = await this.createNewVaultItemsKey({
      vaultSystemIdentifier: params.vaultSystemIdentifier,
      vaultKeyTimestamp: newVaultKeyContent.keyTimestamp,
    })

    if (isClientDisplayableError(updateVaultVaultItemsKeyResult)) {
      errors.push(updateVaultVaultItemsKeyResult)
    }

    await this.encryption.reencryptVaultItemsKeysForVault(params.vaultSystemIdentifier)

    return errors
  }

  private async createNewVaultItemsKey(params: {
    vaultSystemIdentifier: string
    vaultKeyTimestamp: number
  }): Promise<ClientDisplayableError | void> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createVaultItemsKey(newItemsKeyUuid, params.vaultSystemIdentifier)
    await this.items.insertItem(newItemsKey)
  }
}
