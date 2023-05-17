import { HttpResponse, GroupUserKeyServerHash, GroupServerHash } from '@standardnotes/responses'
import { GroupPermission } from './GroupPermission'

export type CreateGroupResponse = {
  group: GroupServerHash
  groupUserKey: GroupUserKeyServerHash
}

export type AddUserToGroupResponse = {
  groupUserKey: GroupUserKeyServerHash
}

export interface GroupsServerInterface {
  createGroup(params: {
    creatorPublicKey: string
    encryptedGroupKey: string
  }): Promise<HttpResponse<CreateGroupResponse>>

  addUserToGroup(params: {
    groupUuid: string
    inviteeUuid: string
    encryptedGroupKey: string
    senderPublicKey: string
    permissions: GroupPermission
  }): Promise<HttpResponse<AddUserToGroupResponse>>
}
