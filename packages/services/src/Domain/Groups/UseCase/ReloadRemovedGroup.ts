import { isErrorResponse } from '@standardnotes/responses'
import { GroupServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { RemoveGroupItemsLocallyUseCase } from '../../Vaults/UseCase/RemoveGroupItemsLocally'

export class ReloadRemovedUseCase {
  constructor(private groupServer: GroupServerInterface, private items: ItemManagerInterface) {}

  async execute(): Promise<void> {
    const response = await this.groupServer.getRemovedGroups()

    if (isErrorResponse(response)) {
      return
    }

    const removedGroupIds = response.data.removedGroups.map((removed) => removed.groupUuid)

    const removeItemsUseCase = new RemoveGroupItemsLocallyUseCase(this.items)
    await removeItemsUseCase.execute({ groupUuids: removedGroupIds })
  }
}
