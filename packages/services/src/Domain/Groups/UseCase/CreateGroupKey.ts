import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'
import { FillItemContent, GroupKeyContent, GroupKeyContentSpecialized, GroupKeyInterface } from '@standardnotes/models'

export class CreateGroupKeyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(content: GroupKeyContentSpecialized): Promise<GroupKeyInterface> {
    const newGroupKey = await this.items.createItem<GroupKeyInterface>(
      ContentType.GroupKey,
      FillItemContent<GroupKeyContent>(content),
      true,
    )

    return newGroupKey
  }
}
