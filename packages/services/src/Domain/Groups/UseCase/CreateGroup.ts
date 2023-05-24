import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError, GroupServerHash, isErrorResponse } from '@standardnotes/responses'
import { GroupsServerInterface } from '@standardnotes/api'
import { CreateGroupKeyUseCase } from './CreateGroupKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class CreateGroupUseCase {
  constructor(
    private items: ItemManagerInterface,
    private groupsServer: GroupsServerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(dto: {
    groupName?: string
    groupDescription?: string
  }): Promise<GroupServerHash | ClientDisplayableError> {
    const groupUuid = UuidGenerator.GenerateUuid()
    const sharedItemsKey = this.encryption.createSharedItemsKey(UuidGenerator.GenerateUuid(), groupUuid)

    const groupKeyContent = this.encryption.createGroupKeyData(groupUuid)
    const createGroupKey = new CreateGroupKeyUseCase(this.items)
    await createGroupKey.execute({
      ...groupKeyContent,
      groupName: dto.groupName,
      groupDescription: dto.groupDescription,
    })

    const response = await this.groupsServer.createGroup({
      groupUuid,
      groupKeyTimestamp: groupKeyContent.keyTimestamp,
      specifiedItemsKeyUuid: sharedItemsKey.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const { group } = response.data

    await this.items.insertItem(sharedItemsKey)

    return group
  }
}
