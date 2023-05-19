import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import {
  AddUserToGroupResponse,
  CreateGroupResponse,
  GetGroupUsersResponse,
  GetManyGroupUserKeysResponse,
  GroupsServerInterface,
  UpdateKeysForGroupMembersKeysParam,
} from './GroupsServerInterface'
import { SharingPaths } from './Paths'
import { GroupPermission } from './GroupPermission'

export class GroupsServer implements GroupsServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createGroup(params: {
    creatorPublicKey: string
    encryptedGroupKey: string
  }): Promise<HttpResponse<CreateGroupResponse>> {
    return this.httpService.post(SharingPaths.createGroup, {
      creator_public_key: params.creatorPublicKey,
      encrypted_group_key: params.encryptedGroupKey,
    })
  }

  addUserToGroup(params: {
    groupUuid: string
    inviteeUuid: string
    senderPublicKey: string
    recipientPublicKey: string
    encryptedGroupKey: string
    permissions: GroupPermission
  }): Promise<HttpResponse<AddUserToGroupResponse>> {
    return this.httpService.post(SharingPaths.addUserToGroup(params.groupUuid), {
      invitee_uuid: params.inviteeUuid,
      sender_public_key: params.senderPublicKey,
      recipient_public_key: params.recipientPublicKey,
      encrypted_group_key: params.encryptedGroupKey,
      permissions: params.permissions,
    })
  }

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(SharingPaths.deleteGroup(params.groupUuid))
  }

  removeUserFromGroup(params: { groupUuid: string; userUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(SharingPaths.removeUserFromGroup(params.groupUuid, params.userUuid))
  }

  updateKeysForAllGroupMembers(params: {
    groupUuid: string
    updatedKeys: UpdateKeysForGroupMembersKeysParam
  }): Promise<HttpResponse<boolean>> {
    return this.httpService.patch(SharingPaths.updateKeysForAllGroupMembers(params.groupUuid), {
      updated_keys: params.updatedKeys,
    })
  }

  getGroupUsers(params: { groupUuid: string }): Promise<HttpResponse<GetGroupUsersResponse>> {
    return this.httpService.get(SharingPaths.getGroupUsers(params.groupUuid))
  }

  getAllUserKeysForCurrentUser(): Promise<HttpResponse<GetManyGroupUserKeysResponse>> {
    return this.httpService.get(SharingPaths.getAllUserKeysForCurrentUser())
  }

  getReceivedUserKeysBySender(params: { senderUuid: string }): Promise<HttpResponse<GetManyGroupUserKeysResponse>> {
    return this.httpService.get(SharingPaths.getReceivedUserKeysBySender(params.senderUuid))
  }
}
