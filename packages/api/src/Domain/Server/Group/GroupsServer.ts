import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GroupsServerInterface } from './GroupsServerInterface'
import { CreateGroupParams } from '../../Request/Group/CreateGroupParams'
import { GroupsPaths } from './Paths'
import { CreateGroupResponse } from '../../Response/Group/CreateGroupResponse'
import { UpdateGroupParams } from '../../Request/Group/UpdateGroupParams'
import { UpdateGroupResponse } from '../../Response/Group/UpdateGroupResponse'
import { GetGroupsResponse } from '../../Response/Group/GetGroupsResponse'
import { CreateGroupValetTokenResponse } from '../../Response/Group/CreateGroupValetTokenResponse'
import { CreateGroupValetTokenParams } from '../../Request/Group/CreateGroupValetTokenParams'
import { GetRemovedGroupsResponse } from '../../Response/Group/GetRemovedGroups'
import { AddItemToGroupRequestParams } from '../../Request/Group/AddItemToGroup'
import { AddItemToGroupResponse } from '../../Response/Group/AddItemToGroupResponse'
import { RemoveItemFromGroupParams } from '../../Request/Group/RemoveItemFromGroup'
import { RemoveItemFromGroupResponse } from '../../Response/Group/RemoveItemFromGroupResponse'

export class GroupsServer implements GroupsServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getGroups(): Promise<HttpResponse<GetGroupsResponse>> {
    return this.httpService.get(GroupsPaths.getGroups)
  }

  createGroup(params: CreateGroupParams): Promise<HttpResponse<CreateGroupResponse>> {
    return this.httpService.post(GroupsPaths.createGroup, {
      vault_system_identifier: params.vaultSystemIdentifier,
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
    })
  }

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(GroupsPaths.deleteGroup(params.groupUuid))
  }

  updateGroup(params: UpdateGroupParams): Promise<HttpResponse<UpdateGroupResponse>> {
    return this.httpService.patch(GroupsPaths.updateGroup(params.groupUuid), {
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
    })
  }

  createGroupFileValetToken(params: CreateGroupValetTokenParams): Promise<HttpResponse<CreateGroupValetTokenResponse>> {
    return this.httpService.post(GroupsPaths.createGroupFileValetToken(params.groupUuid), {
      file_uuid: params.fileUuid,
      remote_identifier: params.remoteIdentifier,
      operation: params.operation,
      unencrypted_file_size: params.unencryptedFileSize,
      move_operation_type: params.moveOperationType,
      group_to_group_move_target_uuid: params.groupToGroupMoveTargetUuid,
    })
  }

  getRemovedGroups(): Promise<HttpResponse<GetRemovedGroupsResponse>> {
    return this.httpService.get(GroupsPaths.getRemovedGroups)
  }

  addItemToGroup(params: AddItemToGroupRequestParams): Promise<HttpResponse<AddItemToGroupResponse>> {
    return this.httpService.post(GroupsPaths.addItemToGroup(params.groupUuid), {
      item_uuid: params.itemUuid,
    })
  }

  removeItemFromGroup(params: RemoveItemFromGroupParams): Promise<HttpResponse<RemoveItemFromGroupResponse>> {
    return this.httpService.delete(GroupsPaths.addItemToGroup(params.groupUuid), {
      item_uuid: params.itemUuid,
    })
  }
}
