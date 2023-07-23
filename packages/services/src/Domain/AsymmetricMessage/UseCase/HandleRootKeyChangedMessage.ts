import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  AsymmetricMessageSharedVaultRootKeyChanged,
  FillItemContent,
  KeySystemRootKeyContent,
  VaultListingMutator,
  VaultListingInterface,
} from '@standardnotes/models'

import { ContentType } from '@standardnotes/domain-core'
import { GetVault } from '../../Vaults/UseCase/GetVault'
import { EncryptionProviderInterface } from '../../Encryption/EncryptionProviderInterface'

export class HandleRootKeyChangedMessage {
  constructor(
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private encryption: EncryptionProviderInterface,
    private getVault: GetVault,
  ) {}

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<void> {
    const rootKeyContent = message.data.rootKey

    await this.mutator.createItem<KeySystemRootKeyInterface>(
      ContentType.TYPES.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    const vault = this.getVault.execute<VaultListingInterface>({ keySystemIdentifier: rootKeyContent.systemIdentifier })
    if (!vault.isFailed()) {
      await this.mutator.changeItem<VaultListingMutator>(vault.getValue(), (mutator) => {
        mutator.rootKeyParams = rootKeyContent.keyParams
      })
    }

    await this.encryption.decryptErroredPayloads()

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }
}
