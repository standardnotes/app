import {
  KeySystemRootKeyInterface,
  AsymmetricMessageSharedVaultRootKeyChanged,
  FillItemContent,
  KeySystemRootKeyContent,
  VaultListingMutator,
} from '@standardnotes/models'
import { ContentType, UseCaseInterface, Result } from '@standardnotes/domain-core'

import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import { GetVaultUseCase } from '../../Vaults/UseCase/GetVault'
import { EmitDecryptedErroredPayloads } from '../../Encryption/UseCase/EmitDecryptedErroredPayloads/EmitDecryptedErroredPayloads'

export class HandleTrustedSharedVaultRootKeyChangedMessage implements UseCaseInterface<void> {
  constructor(
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private emitDecryptedErroredPayloadsUseCase: EmitDecryptedErroredPayloads,
  ) {}

  async execute(message: AsymmetricMessageSharedVaultRootKeyChanged): Promise<Result<void>> {
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

    const emitedOrFailed = await this.emitDecryptedErroredPayloadsUseCase.execute()
    if (emitedOrFailed.isFailed()) {
      return Result.fail(emitedOrFailed.getError())
    }

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })

    return Result.ok()
  }
}
