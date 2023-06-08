import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
  AsymmetricMessageSharedVaultRootKeyChanged,
} from '@standardnotes/models'
import { CreateKeySystemRootKeyUseCase } from '../../Vaults/UseCase/CreateKeySystemRootKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class HandleTrustedSharedVaultRootKeyChangedMessage {
  constructor(private items: ItemManagerInterface, private sync: SyncServiceInterface) {}

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<'inserted' | 'changed'> {
    const keyContent = message.data

    const existingKeySystemRootKey = this.items.getKeySystemRootKeyMatchingTimestamp(
      keyContent.systemIdentifier,
      keyContent.keyTimestamp,
    )

    if (existingKeySystemRootKey) {
      await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
        existingKeySystemRootKey,
        (mutator) => {
          mutator.systemName = keyContent.systemName
          mutator.systemDescription = keyContent.systemDescription
        },
      )

      await this.sync.sync()

      return 'changed'
    }

    const createKeySystemRootKey = new CreateKeySystemRootKeyUseCase(this.items)
    await createKeySystemRootKey.execute(keyContent)

    await this.sync.sync()
    return 'inserted'
  }
}
