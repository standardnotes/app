import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
  AsymmetricMessageSharedVaultRootKeyChanged,
  FillItemContent,
  KeySystemRootKeyContent,
} from '@standardnotes/models'

import { ContentType } from '@standardnotes/common'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class HandleTrustedSharedVaultRootKeyChangedMessage {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<'inserted' | 'changed'> {
    const rootKeyContent = message.data

    const existingKeySystemRootKey = this.encryption.keySystemKeyManager.getKeySystemRootKeyWithToken(
      rootKeyContent.systemIdentifier,
      rootKeyContent.token,
    )

    if (existingKeySystemRootKey) {
      await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
        existingKeySystemRootKey,
        (mutator) => {
          mutator.systemName = rootKeyContent.systemName
          mutator.systemDescription = rootKeyContent.systemDescription
        },
      )

      await this.sync.sync()

      return 'changed'
    }

    await this.items.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    await this.sync.sync()
    return 'inserted'
  }
}
