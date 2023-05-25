import { UuidGenerator } from '@standardnotes/utils'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, GroupServerHash, isClientDisplayableError } from '@standardnotes/responses'
import { GroupInvitesServerInterface, GroupUsersServerInterface, GroupsServerInterface } from '@standardnotes/api'
import { UpdateGroupUseCase } from './UpdateGroup'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { GroupStorageServiceInterface } from '../GroupStorageServiceInterface'
import { ChangeGroupKeyDataUseCase } from './ChangeGroupKeyData'

export class RotateGroupKeyUseCase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private groupsServer: GroupsServerInterface,
    private groupInvitesServer: GroupInvitesServerInterface,
    private groupUsersServer: GroupUsersServerInterface,
    private contacts: ContactServiceInterface,
    private groupStorage: GroupStorageServiceInterface,
  ) {}

  async execute(params: {
    groupUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<undefined | ClientDisplayableError[]> {
    const groupKey = this.encryption.getGroupKey(params.groupUuid)
    if (!groupKey) {
      throw new Error('Cannot rotate group key; group key not found')
    }

    const newGroupContent = this.encryption.createGroupKeyData(params.groupUuid)

    const errors: ClientDisplayableError[] = []

    const updateGroupSharedItemsKeyResult = await this.createNewSharedItemsKey({
      groupUuid: params.groupUuid,
      groupKeyTimestamp: newGroupContent.keyTimestamp,
    })

    if (isClientDisplayableError(updateGroupSharedItemsKeyResult)) {
      errors.push(updateGroupSharedItemsKeyResult)
    }

    await this.encryption.reencryptSharedItemsKeysForGroup(params.groupUuid)

    const changeGroupDataUseCase = new ChangeGroupKeyDataUseCase(
      this.items,
      this.encryption,
      this.groupInvitesServer,
      this.groupUsersServer,
      this.contacts,
    )

    const changeGroupDataErrors = await changeGroupDataUseCase.execute({
      groupUuid: params.groupUuid,
      newGroupData: newGroupContent,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })

    errors.push(...changeGroupDataErrors)

    return errors
  }

  private async createNewSharedItemsKey(params: {
    groupUuid: string
    groupKeyTimestamp: number
  }): Promise<ClientDisplayableError | GroupServerHash> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createSharedItemsKey(newItemsKeyUuid, params.groupUuid)
    await this.items.insertItem(newItemsKey)

    const updateGroupUseCase = new UpdateGroupUseCase(this.groupsServer)
    const updateResult = await updateGroupUseCase.execute({
      groupUuid: params.groupUuid,
      groupKeyTimestamp: params.groupKeyTimestamp,
      specifiedItemsKeyUuid: newItemsKey.uuid,
    })

    if (isClientDisplayableError(updateResult)) {
      return updateResult
    }

    this.groupStorage.setGroup(updateResult)

    return updateResult
  }
}
