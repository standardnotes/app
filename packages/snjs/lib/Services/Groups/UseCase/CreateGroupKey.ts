import { ItemManagerInterface } from '@standardnotes/services'
import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { FillItemContent, GroupKeyContent, GroupKeyContentSpecialized, GroupKeyInterface } from '@standardnotes/models'

export class CreateGroupKeyUseCase {
  constructor(
    private params: {
      groupUuid: string
      groupKey: string
      keyVersion: ProtocolVersion
    },
    private items: ItemManagerInterface,
  ) {}

  async execute(): Promise<GroupKeyInterface> {
    const newGroupKeyContent: GroupKeyContentSpecialized = {
      groupUuid: this.params.groupUuid,
      groupKey: this.params.groupKey,
      keyVersion: this.params.keyVersion,
    }

    const newGroupKey = await this.items.createItem<GroupKeyInterface>(
      ContentType.GroupKey,
      FillItemContent<GroupKeyContent>(newGroupKeyContent),
      true,
    )

    return newGroupKey
  }
}
