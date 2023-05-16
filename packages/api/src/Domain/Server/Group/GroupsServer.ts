import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GroupsServerInterface } from './GroupsServerInterface'
import { SharingPaths } from './Paths'
import { GroupInterface } from './Group'
import { GroupUserInterface } from './GroupUser'
import { GroupPermission } from './GroupPermission'

export class GroupsServer implements GroupsServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createGroup(): Promise<HttpResponse<GroupInterface>> {
    return this.httpService.post(SharingPaths.createGroup)
  }

  getUserGroups(): Promise<HttpResponse<GroupInterface[]>> {
    return this.httpService.get(SharingPaths.getUserGroups)
  }

  addUserToGroup(
    groupUuid: string,
    inviteeUuid: string,
    encryptedGroupKey: string,
    permissions: GroupPermission,
  ): Promise<HttpResponse<GroupUserInterface>> {
    return this.httpService.post(SharingPaths.addUserToGroup(groupUuid), {
      inviteeUuid,
      permissions,
      encryptedGroupKey,
    })
  }
}
