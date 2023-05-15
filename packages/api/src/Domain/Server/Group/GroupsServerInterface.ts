import { HttpResponse } from '@standardnotes/responses'
import { GroupInterface } from './Group'
import { GroupUserInterface } from './GroupUser'
import { GroupPermission } from './GroupPermission'

export interface GroupsServerInterface {
  createGroup(): Promise<HttpResponse<GroupInterface>>
  getUserGroups(): Promise<HttpResponse<GroupInterface[]>>
  addUserToGroup(
    groupUuid: string,
    inviteeUuid: string,
    encryptedGroupKey: string,
    permissions: GroupPermission,
  ): Promise<HttpResponse<GroupUserInterface>>
  addItemToGroup(itemUuid: string, groupUuid: string): Promise<HttpResponse<boolean>>
}
