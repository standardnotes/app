import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { GroupUsersServerInterface } from '@standardnotes/api'
import { RemoveGroupItemsLocallyUseCase } from '../../Vaults/UseCase/RemoveGroupItemsLocally'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class LeaveVaultUseCase {
  constructor(private vaultUserServer: GroupUsersServerInterface, private items: ItemManagerInterface) {}

  async execute(params: { groupUuid: string; userUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultUserServer.deleteGroupUser({
      groupUuid: params.groupUuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to leave vault ${response}`)
    }

    const removeLocalItems = new RemoveGroupItemsLocallyUseCase(this.items)
    await removeLocalItems.execute({ groupUuids: [params.groupUuid] })
  }
}
