import {
  HttpResponse,
  GroupUserKeyServerHash,
  GroupServerHash,
  GroupUserListingServerHash,
} from '@standardnotes/responses'
import { GroupPermission } from './GroupPermission'

export type CreateGroupResponse = {
  group: GroupServerHash
  groupUserKey: GroupUserKeyServerHash
}

export type AddUserToGroupResponse = {
  groupUserKey: GroupUserKeyServerHash
}

export type GetGroupUsersResponse = {
  users: GroupUserListingServerHash[]
}

export type GetManyGroupUserKeysResponse = {
  groupUserKeys: GroupUserKeyServerHash[]
}

export type UpdateKeysForGroupMembersKeysParam = {
  userUuid: string
  senderPublicKey: string
  recipientPublicKey: string
  encryptedGroupKey: string
}[]

export interface GroupsServerInterface {
  createGroup(params: {
    creatorPublicKey: string
    encryptedGroupKey: string
  }): Promise<HttpResponse<CreateGroupResponse>>

  addUserToGroup(params: {
    groupUuid: string
    inviteeUuid: string
    senderPublicKey: string
    recipientPublicKey: string
    encryptedGroupKey: string
    permissions: GroupPermission
  }): Promise<HttpResponse<AddUserToGroupResponse>>

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>>

  removeUserFromGroup(params: { groupUuid: string; userUuid: string }): Promise<HttpResponse<boolean>>

  updateKeysForAllGroupMembers(params: {
    groupUuid: string
    updatedKeys: UpdateKeysForGroupMembersKeysParam
  }): Promise<HttpResponse<boolean>>

  getGroupUsers(params: { groupUuid: string }): Promise<HttpResponse<GetGroupUsersResponse>>

  getAllUserKeysForCurrentUser(): Promise<HttpResponse<GetManyGroupUserKeysResponse>>

  getReceivedUserKeysBySender(params: { senderUuid: string }): Promise<HttpResponse<GetManyGroupUserKeysResponse>>
}
