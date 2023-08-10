import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { HttpError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultListingInterface, VaultListingInterface, VaultListingMutator } from '@standardnotes/models'

import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class SyncLocalVaultsWithRemoteSharedVaults implements UseCaseInterface<void> {
  constructor(
    private sharedVaultServer: SharedVaultServerInterface,
    private mutator: MutatorClientInterface,
  ) {}

  async execute(localVaults: VaultListingInterface[]): Promise<Result<void>> {
    const remoteVaultsResponse = await this.sharedVaultServer.getSharedVaults()
    if (isErrorResponse(remoteVaultsResponse)) {
      return Result.fail((remoteVaultsResponse.data.error as HttpError).message as string)
    }
    const remoteVaults = remoteVaultsResponse.data.sharedVaults

    for (const localVault of localVaults) {
      if (!localVault.isSharedVaultListing()) {
        continue
      }
      const remoteVault = remoteVaults.find((vault) => vault.uuid === localVault.sharing.sharedVaultUuid)
      if (remoteVault) {
        await this.mutator.changeItem<VaultListingMutator, SharedVaultListingInterface>(localVault, (mutator) => {
          /* istanbul ignore next */
          mutator.sharing = {
            sharedVaultUuid: remoteVault.uuid,
            ownerUserUuid: remoteVault.user_uuid,
            fileBytesUsed: remoteVault.file_upload_bytes_used,
          }
        })
      }
    }

    return Result.ok()
  }
}
