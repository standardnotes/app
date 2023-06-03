import { UuidGenerator } from '@standardnotes/utils'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { CreateVaultKeyUseCase } from './CreateVaultKey'
import { KeySystemIdentifier } from '@standardnotes/models'

export class RotateVaultKeyUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(params: { keySystemIdentifier: KeySystemIdentifier }): Promise<undefined | ClientDisplayableError[]> {
    const vaultKeyCopy = this.items.getPrimarySyncedVaultKeyCopy(params.keySystemIdentifier)
    if (!vaultKeyCopy) {
      throw new Error('Cannot rotate vault key; vault key not found')
    }

    const newVaultKeyContent = this.encryption.createVaultKeyContent({
      keySystemIdentifier: params.keySystemIdentifier,
      vaultName: vaultKeyCopy.vaultName,
    })
    const createVaultKey = new CreateVaultKeyUseCase(this.items)
    await createVaultKey.execute(newVaultKeyContent)

    const errors: ClientDisplayableError[] = []

    const updateVaultVaultItemsKeyResult = await this.createNewVaultItemsKey({
      keySystemIdentifier: params.keySystemIdentifier,
      vaultKeyTimestamp: newVaultKeyContent.keyTimestamp,
    })

    if (isClientDisplayableError(updateVaultVaultItemsKeyResult)) {
      errors.push(updateVaultVaultItemsKeyResult)
    }

    await this.encryption.reencryptVaultItemsKeysForVault(params.keySystemIdentifier)

    return errors
  }

  private async createNewVaultItemsKey(params: {
    keySystemIdentifier: KeySystemIdentifier
    vaultKeyTimestamp: number
  }): Promise<ClientDisplayableError | void> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createVaultItemsKey(newItemsKeyUuid, params.keySystemIdentifier)
    await this.items.insertItem(newItemsKey)
  }
}
