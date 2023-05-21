import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { UuidGenerator } from '@standardnotes/utils'
import { ClientDisplayableError, GroupServerHash, isErrorResponse } from '@standardnotes/responses'
import { ItemManagerInterface } from '@standardnotes/services'
import { DecryptedItem } from '@standardnotes/models'
import { GroupsServerInterface } from '@standardnotes/api'
import { CreateGroupKeyUseCase } from './CreateGroupKey'

export class CreateGroupUseCase {
  constructor(
    private items: ItemManagerInterface,
    private groupsServer: GroupsServerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(): Promise<GroupServerHash | ClientDisplayableError> {
    const tempGroupUuid = UuidGenerator.GenerateUuid()
    const sharedItemsKeyUuid = UuidGenerator.GenerateUuid()
    const tempSharedItemsKey = this.encryption.createSharedItemsKey(sharedItemsKeyUuid, tempGroupUuid)

    const response = await this.groupsServer.createGroup({
      specifiedItemsKeyUuid: sharedItemsKeyUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const { group } = response.data
    const groupUuid = group.uuid

    const { key, version } = this.encryption.createGroupKeyString()
    const createGroupKey = new CreateGroupKeyUseCase(this.items)

    await createGroupKey.execute({
      groupUuid: group.uuid,
      groupKey: key,
      keyVersion: version,
    })

    const sharedItemsKey = new DecryptedItem(
      tempSharedItemsKey.payload.copy({
        group_uuid: groupUuid,
      }),
    )

    await this.items.insertItem(sharedItemsKey)

    return group
  }
}
