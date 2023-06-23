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

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<void> {
    const rootKeyContent = message.data.rootKey

    await this.items.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }
}
