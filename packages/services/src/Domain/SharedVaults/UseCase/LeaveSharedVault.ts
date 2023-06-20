import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'
import { RemoveSharedVaultItemsLocallyUseCase } from './RemoveSharedVaultItemsLocally'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class LeaveVaultUseCase {
  constructor(private vaultUserServer: SharedVaultUsersServerInterface, private items: ItemManagerInterface) {}

  async execute(params: { sharedVaultUuid: string; userUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultUserServer.deleteSharedVaultUser({
      sharedVaultUuid: params.sharedVaultUuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to leave vault ${JSON.stringify(response)}`)
    }

    const removeLocalItems = new RemoveSharedVaultItemsLocallyUseCase(this.items)
    await removeLocalItems.execute({ sharedVaultUuids: [params.sharedVaultUuid] })
  }
}
