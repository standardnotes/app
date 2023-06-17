import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  AsymmetricMessageSharedVaultRootKeyChanged,
  FillItemContent,
  KeySystemRootKeyContent,
} from '@standardnotes/models'

import { ContentType } from '@standardnotes/common'

export class HandleTrustedSharedVaultRootKeyChangedMessage {
  constructor(private items: ItemManagerInterface, private sync: SyncServiceInterface) {}

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<'inserted' | 'changed'> {
    const rootKeyContent = message.data

    await this.items.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    await this.sync.sync()
    return 'inserted'
  }
}
