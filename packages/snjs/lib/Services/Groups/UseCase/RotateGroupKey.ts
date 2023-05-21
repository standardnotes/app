import { UuidGenerator } from '@standardnotes/utils'
import { GroupKeyInterface, GroupKeyMutator } from '@standardnotes/models'
import { ContactServiceInterface, GroupStorageServiceInterface, ItemManagerInterface } from '@standardnotes/services'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  GroupInviteType,
  GroupServerHash,
  isClientDisplayableError,
} from '@standardnotes/responses'
import { GroupInvitesServerInterface, GroupUsersServerInterface, GroupsServerInterface } from '@standardnotes/api'
import { GetGroupUsersUseCase } from './GetGroupUsers'
import { CreateGroupInviteUseCase } from './CreateInvite'
import { UpdateGroupUseCase } from './UpdateGroup'

/**
 * When the user rotates the group key, we need to:
 * 1. Update our group key value
 * 2. Create a new shared items key and update the group specified items key
 * 2. Get all group users and send them a key-change invite
 */
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
    const updatedGroupKey = await this.changeGroupKey(params.groupUuid)

    const errors: ClientDisplayableError[] = []

    const updateGroupSharedItemsKeyResult = await this.updateGroupSharedItemsKey(params.groupUuid)

    if (isClientDisplayableError(updateGroupSharedItemsKeyResult)) {
      errors.push(updateGroupSharedItemsKeyResult)
    }

    await this.encryption.reencryptSharedItemsKeysForGroup(params.groupUuid)

    const inviteErrors = await this.sendKeyChangeInviteToAllGroupUsers({
      groupKey: updatedGroupKey.groupKey,
      groupUuid: params.groupUuid,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })

    if (inviteErrors) {
      errors.push(...inviteErrors)
    }

    return errors
  }

  private async changeGroupKey(groupUuid: string): Promise<GroupKeyInterface> {
    const { key, version } = this.encryption.createGroupKeyString()
    const groupKey = this.encryption.getGroupKey(groupUuid)
    if (!groupKey) {
      throw new Error('Cannot rotate group key; group key not found')
    }

    const updatedGroupKey = await this.items.changeItem<GroupKeyMutator, GroupKeyInterface>(groupKey, (mutator) => {
      mutator.groupKey = key
      mutator.keyVersion = version
    })

    return updatedGroupKey
  }

  private async sendKeyChangeInviteToAllGroupUsers(params: {
    groupKey: string
    groupUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<undefined | ClientDisplayableError[]> {
    const getUsersUseCase = new GetGroupUsersUseCase(this.groupUsersServer)
    const users = await getUsersUseCase.execute({ groupUuid: params.groupUuid })
    if (!users) {
      return [ClientDisplayableError.FromString('Cannot rotate group key; users not found')]
    }
    if (users.length === 0) {
      return
    }

    const errors: ClientDisplayableError[] = []

    for (const user of users) {
      if (user.user_uuid === params.inviterUuid) {
        continue
      }

      const trustedContact = this.contacts.findTrustedContact(user.user_uuid)
      if (!trustedContact) {
        errors.push(ClientDisplayableError.FromString('Cannot send key-change invite; contact not found'))
        continue
      }

      const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
        params.groupKey,
        params.inviterPrivateKey,
        trustedContact.contactPublicKey,
      )

      const createInviteUseCase = new CreateGroupInviteUseCase(this.groupInvitesServer)
      const createInviteResult = await createInviteUseCase.execute({
        groupUuid: params.groupUuid,
        inviteeUuid: trustedContact.contactUserUuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedGroupKey,
        inviteType: GroupInviteType.KeyChange,
        permissions: user.permissions,
      })

      if (isClientDisplayableError(createInviteResult)) {
        errors.push(createInviteResult)
      }
    }

    return errors
  }

  private async updateGroupSharedItemsKey(groupUuid: string): Promise<ClientDisplayableError | GroupServerHash> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createSharedItemsKey(newItemsKeyUuid, groupUuid)
    await this.items.insertItem(newItemsKey)

    const updateGroupUseCase = new UpdateGroupUseCase(this.groupsServer)
    const updateResult = await updateGroupUseCase.execute({
      groupUuid,
      specifiedItemsKeyUuid: newItemsKey.uuid,
    })

    if (isClientDisplayableError(updateResult)) {
      return updateResult
    }

    this.groupStorage.setGroup(updateResult)

    return updateResult
  }
}
