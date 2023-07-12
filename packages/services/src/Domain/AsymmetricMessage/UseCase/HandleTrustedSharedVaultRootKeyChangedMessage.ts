import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  AsymmetricMessageSharedVaultRootKeyChanged,
  FillItemContent,
  KeySystemRootKeyContent,
  VaultListingMutator,
} from '@standardnotes/models'

import { ContentType } from '@standardnotes/domain-core'
import { GetVaultUseCase } from '../../Vaults/UseCase/GetVault'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class HandleTrustedSharedVaultRootKeyChangedMessage {
  constructor(
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<void> {
    const rootKeyContent = message.data.rootKey

    await this.mutator.createItem<KeySystemRootKeyInterface>(
      ContentType.TYPES.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    const vault = new GetVaultUseCase(this.items).execute({ keySystemIdentifier: rootKeyContent.systemIdentifier })
    if (vault) {
      await this.mutator.changeItem<VaultListingMutator>(vault, (mutator) => {
        mutator.rootKeyParams = rootKeyContent.keyParams
      })
    }

    await this.encryption.decryptErroredPayloads()

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }
}
