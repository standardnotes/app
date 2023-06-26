import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  AsymmetricMessageSharedVaultRootKeyChanged,
  FillItemContent,
  KeySystemRootKeyContent,
} from '@standardnotes/models'

import { ContentType } from '@standardnotes/common'

export class HandleTrustedSharedVaultRootKeyChangedMessage {
  constructor(private mutator: MutatorClientInterface, private sync: SyncServiceInterface) {}

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<void> {
    const rootKeyContent = message.data.rootKey

    await this.mutator.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }
}
