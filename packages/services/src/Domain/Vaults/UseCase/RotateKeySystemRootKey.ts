import { UuidGenerator } from '@standardnotes/utils'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { CreateKeySystemRootKeyUseCase } from './CreateKeySystemRootKey'
import { KeySystemIdentifier } from '@standardnotes/models'

export class RotateKeySystemRootKeyUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(params: { keySystemIdentifier: KeySystemIdentifier }): Promise<undefined | ClientDisplayableError[]> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.keySystemIdentifier)
    if (!keySystemRootKey) {
      throw new Error('Cannot rotate vault key; vault key not found')
    }

    const newKeySystemRootKeyContent = this.encryption.createKeySystemRootKeyContent({
      systemIdentifier: params.keySystemIdentifier,
      systemName: keySystemRootKey.systemName,
    })
    const createKeySystemRootKey = new CreateKeySystemRootKeyUseCase(this.items)
    await createKeySystemRootKey.execute(newKeySystemRootKeyContent)

    const errors: ClientDisplayableError[] = []

    const updateKeySystemRootKeySystemItemsKeyResult = await this.createNewKeySystemItemsKey({
      keySystemIdentifier: params.keySystemIdentifier,
      keySystemRootKeyTimestamp: newKeySystemRootKeyContent.keyTimestamp,
    })

    if (isClientDisplayableError(updateKeySystemRootKeySystemItemsKeyResult)) {
      errors.push(updateKeySystemRootKeySystemItemsKeyResult)
    }

    await this.encryption.reencryptKeySystemItemsKeysForVault(params.keySystemIdentifier)

    return errors
  }

  private async createNewKeySystemItemsKey(params: {
    keySystemIdentifier: KeySystemIdentifier
    keySystemRootKeyTimestamp: number
  }): Promise<ClientDisplayableError | void> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createKeySystemItemsKey(newItemsKeyUuid, params.keySystemIdentifier)
    await this.items.insertItem(newItemsKey)
  }
}
