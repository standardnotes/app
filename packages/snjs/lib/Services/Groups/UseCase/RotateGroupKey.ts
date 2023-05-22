import { UuidGenerator } from '@standardnotes/utils'
import { GroupKeyInterface, GroupKeyMutator } from '@standardnotes/models'
import { ContactServiceInterface, GroupStorageServiceInterface, ItemManagerInterface } from '@standardnotes/services'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  GroupInviteType,
  GroupServerHash,
  isClientDisplayableError,
  isErrorResponse,
} from '@standardnotes/responses'
import { GroupInvitesServerInterface, GroupUsersServerInterface, GroupsServerInterface } from '@standardnotes/api'
import { GetGroupUsersUseCase } from './GetGroupUsers'
import { CreateGroupInviteUseCase } from './CreateGroupInvite'
import { UpdateGroupUseCase } from './UpdateGroup'
import { UpdateGroupInviteUseCase } from './UpdateGroupInvite'

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

    const inviteErrors = await this.sendKeyChangeInviteToAcceptedGroupMembers({
      groupKey: updatedGroupKey.groupKey,
      groupUuid: params.groupUuid,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })

    const reuploadErrors = await this.reuploadExistingInvites({
      groupKey: updatedGroupKey.groupKey,
      groupUuid: params.groupUuid,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })

    errors.push(...inviteErrors)
    errors.push(...reuploadErrors)

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

  private async reuploadExistingInvites(params: {
    groupKey: string
    groupUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const response = await this.groupInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return [ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)]
    }

    const invites = response.data.invites

    const existingGroupInvites = invites.filter((invite) => invite.group_uuid === params.groupUuid)

    const errors: ClientDisplayableError[] = []

    for (const invite of existingGroupInvites) {
      const encryptedGroupKey = this.getEncryptedGroupKeyForRecipient({
        groupKey: params.groupKey,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: invite.user_uuid,
      })

      if (!encryptedGroupKey) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt group key for user ${invite.user_uuid}`))
        continue
      }

      const updateInviteUseCase = new UpdateGroupInviteUseCase(this.groupInvitesServer)
      const updateInviteResult = await updateInviteUseCase.execute({
        groupUuid: params.groupUuid,
        inviteUuid: invite.user_uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedGroupKey,
        inviteType: invite.invite_type,
        permissions: invite.permissions,
      })

      if (isClientDisplayableError(updateInviteResult)) {
        errors.push(updateInviteResult)
      }
    }

    return errors
  }

  private async sendKeyChangeInviteToAcceptedGroupMembers(params: {
    groupKey: string
    groupUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const getUsersUseCase = new GetGroupUsersUseCase(this.groupUsersServer)
    const users = await getUsersUseCase.execute({ groupUuid: params.groupUuid })
    if (!users) {
      return [ClientDisplayableError.FromString('Cannot rotate group key; users not found')]
    }
    if (users.length === 0) {
      return []
    }

    const errors: ClientDisplayableError[] = []

    for (const user of users) {
      if (user.user_uuid === params.inviterUuid) {
        continue
      }

      const encryptedGroupKey = this.getEncryptedGroupKeyForRecipient({
        groupKey: params.groupKey,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: user.user_uuid,
      })

      if (!encryptedGroupKey) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt group key for user ${user.user_uuid}`))
        continue
      }

      const createInviteUseCase = new CreateGroupInviteUseCase(this.groupInvitesServer)
      const createInviteResult = await createInviteUseCase.execute({
        groupUuid: params.groupUuid,
        inviteeUuid: user.user_uuid,
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

  private getEncryptedGroupKeyForRecipient(params: {
    groupKey: string
    inviterPrivateKey: string
    recipientUuid: string
  }): string | undefined {
    const trustedContact = this.contacts.findTrustedContact(params.recipientUuid)
    if (!trustedContact) {
      return
    }

    return this.encryption.encryptGroupKeyWithRecipientPublicKey(
      params.groupKey,
      params.inviterPrivateKey,
      trustedContact.publicKey,
    )
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
