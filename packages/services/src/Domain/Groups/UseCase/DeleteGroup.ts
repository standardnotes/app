import { ClientDisplayableError } from '@standardnotes/responses'
import { GroupsServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { RemoveItemFromGroupUseCase } from './RemoveItemFromGroup'
import { DecryptedItemInterface } from '@standardnotes/models'

export class DeleteGroupUseCase {
  constructor(private items: ItemManagerInterface, private groupsServer: GroupsServerInterface) {}

  async execute(dto: { groupUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.groupsServer.deleteGroup({ groupUuid: dto.groupUuid })

    if (!response) {
      return ClientDisplayableError.FromString('Failed to delete group')
    }

    await this.deleteSharedItemsKeysForGroup(dto.groupUuid)

    const groupItems = this.items.itemsBelongingToGroup(dto.groupUuid)

    await this.removeGroupFromItems(groupItems)
  }

  async deleteSharedItemsKeysForGroup(groupUuid: string): Promise<void> {
    const sharedItemsKeys = this.items.getSharedItemsKeysForGroup(groupUuid)

    await this.removeGroupFromItems(sharedItemsKeys)

    await this.items.setItemsToBeDeleted(sharedItemsKeys)
  }

  async removeGroupFromItems(items: DecryptedItemInterface[]): Promise<void> {
    for (const item of items) {
      const useCase = new RemoveItemFromGroupUseCase(this.items)
      await useCase.execute({ item })
    }
  }
}
