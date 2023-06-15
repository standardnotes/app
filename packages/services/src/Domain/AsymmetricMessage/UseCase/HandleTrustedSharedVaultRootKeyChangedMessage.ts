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
    const keyContent = message.data

    const existingKeySystemRootKey = this.encryption.keySystemKeyManager.getKeySystemRootKeyMatchingAnchor(
      keyContent.systemIdentifier,
      keyContent.itemsKeyAnchor,
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

    await this.items.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(keyContent),
      true,
    )

    await this.sync.sync()
    return 'inserted'
  }
}
