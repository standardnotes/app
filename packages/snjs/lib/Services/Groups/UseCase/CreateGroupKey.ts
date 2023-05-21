import { ItemManagerInterface } from '@standardnotes/services'
import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { FillItemContent, GroupKeyContent, GroupKeyContentSpecialized, GroupKeyInterface } from '@standardnotes/models'

export class CreateGroupKeyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(params: {
    groupUuid: string
    groupKey: string
    keyVersion: ProtocolVersion
  }): Promise<GroupKeyInterface> {
    const newGroupKeyContent: GroupKeyContentSpecialized = {
      groupUuid: params.groupUuid,
      groupKey: params.groupKey,
      keyVersion: params.keyVersion,
    }

    const newGroupKey = await this.items.createItem<GroupKeyInterface>(
      ContentType.GroupKey,
      FillItemContent<GroupKeyContent>(newGroupKeyContent),
      true,
    )

    return newGroupKey
  }
}
