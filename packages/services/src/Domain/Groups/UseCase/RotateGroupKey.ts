import { UuidGenerator } from '@standardnotes/utils'
import { GroupKeyContentSpecialized, GroupKeyInterface, GroupKeyMutator } from '@standardnotes/models'
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
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { GroupStorageServiceInterface } from '../GroupStorageServiceInterface'

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

    const updateGroupSharedItemsKeyResult = await this.createNewSharedItemsKey({
      groupUuid: params.groupUuid,
      groupKeyTimestamp: updatedGroupKey.keyTimestamp,
    })

    if (isClientDisplayableError(updateGroupSharedItemsKeyResult)) {
      errors.push(updateGroupSharedItemsKeyResult)
    }

    await this.encryption.reencryptSharedItemsKeysForGroup(params.groupUuid)

    const reuploadErrors = await this.reuploadExistingInvites({
      groupData: updatedGroupKey.content,
      groupUuid: params.groupUuid,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...reuploadErrors)

    const inviteErrors = await this.sendKeyChangeInviteToAcceptedGroupMembers({
      groupData: updatedGroupKey.content,
      groupUuid: params.groupUuid,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...inviteErrors)

    return errors
  }

  private async changeGroupKey(groupUuid: string): Promise<GroupKeyInterface> {
    const groupKey = this.encryption.getGroupKey(groupUuid)
    if (!groupKey) {
      throw new Error('Cannot rotate group key; group key not found')
    }

    const groupKeyContent = this.encryption.createGroupKeyData(groupUuid)
    const updatedGroupKey = await this.items.changeItem<GroupKeyMutator, GroupKeyInterface>(groupKey, (mutator) => {
      mutator.content = groupKeyContent
    })

    return updatedGroupKey
  }

  private async reuploadExistingInvites(params: {
    groupData: GroupKeyContentSpecialized
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
      const encryptedGroupData = this.getEncryptedGroupDataForRecipient({
        groupData: params.groupData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: invite.user_uuid,
      })

      if (!encryptedGroupData) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt group key for user ${invite.user_uuid}`))
        continue
      }

      const updateInviteUseCase = new UpdateGroupInviteUseCase(this.groupInvitesServer)
      const updateInviteResult = await updateInviteUseCase.execute({
        groupUuid: params.groupUuid,
        inviteUuid: invite.uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedGroupData,
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
    groupData: GroupKeyContentSpecialized
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

      const encryptedGroupData = this.getEncryptedGroupDataForRecipient({
        groupData: params.groupData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: user.user_uuid,
      })

      if (!encryptedGroupData) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt group key for user ${user.user_uuid}`))
        continue
      }

      const createInviteUseCase = new CreateGroupInviteUseCase(this.groupInvitesServer)
      const createInviteResult = await createInviteUseCase.execute({
        groupUuid: params.groupUuid,
        inviteeUuid: user.user_uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedGroupData,
        inviteType: GroupInviteType.KeyChange,
        permissions: user.permissions,
      })

      if (isClientDisplayableError(createInviteResult)) {
        errors.push(createInviteResult)
      }
    }

    return errors
  }

  private getEncryptedGroupDataForRecipient(params: {
    groupData: GroupKeyContentSpecialized
    inviterPrivateKey: string
    recipientUuid: string
  }): string | undefined {
    const trustedContact = this.contacts.findTrustedContact(params.recipientUuid)
    if (!trustedContact) {
      return
    }

    return this.encryption.encryptGroupDataWithRecipientPublicKey(
      params.groupData,
      params.inviterPrivateKey,
      trustedContact.publicKey,
    )
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
