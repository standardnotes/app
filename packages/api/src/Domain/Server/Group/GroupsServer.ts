import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { AddUserToGroupResponse, CreateGroupResponse, GroupsServerInterface } from './GroupsServerInterface'
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
    encryptedGroupKey: string
    senderPublicKey: string
    permissions: GroupPermission
  }): Promise<HttpResponse<AddUserToGroupResponse>> {
    return this.httpService.post(SharingPaths.addUserToGroup(params.groupUuid), {
      invitee_uuid: params.inviteeUuid,
      permissions: params.permissions,
      encrypted_group_key: params.encryptedGroupKey,
      sender_public_key: params.senderPublicKey,
    })
  }
}
