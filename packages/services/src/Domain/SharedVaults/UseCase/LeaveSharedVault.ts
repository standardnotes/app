import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { StorageServiceInterface } from './../../Storage/StorageServiceInterface'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'
import { DeleteExternalSharedVaultUseCase } from './DeleteExternalSharedVault'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class LeaveVaultUseCase {
  constructor(
    private vaultUserServer: SharedVaultUsersServerInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private storage: StorageServiceInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(params: {
    sharedVault: SharedVaultListingInterface
    userUuid: string
  }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultUserServer.deleteSharedVaultUser({
      sharedVaultUuid: params.sharedVault.uuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to leave vault ${JSON.stringify(response)}`)
    }

    const removeLocalItems = new DeleteExternalSharedVaultUseCase(this.items, this.encryption, this.storage, this.sync)
    await removeLocalItems.execute(params.sharedVault)
  }
}
