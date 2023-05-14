import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { SharingServerInterface } from './SharingServerInterface'
import { SharingPaths } from './Paths'
import { ShareGroupInterface } from './ShareGroup'
import { ShareGroupItemInterface } from './ShareGroupItem'
import { ShareGroupUserInterface } from './ShareGroupUser'
import { ShareGroupPermission } from './ShareGroupPermission'

export class SharingServer implements SharingServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createShareGroup(): Promise<HttpResponse<ShareGroupInterface>> {
    return this.httpService.post(SharingPaths.createShareGroup)
  }

  addUserToShareGroup(
    groupUuid: string,
    userUuid: string,
    encryptedGroupKey: string,
    permissions: ShareGroupPermission,
  ): Promise<HttpResponse<ShareGroupUserInterface>> {
    return this.httpService.post(SharingPaths.addUserToShareGroup(groupUuid), {
      userUuid,
      permissions,
      encryptedGroupKey,
    })
  }

  addItemToShareGroup(itemUuid: string, groupUuid: string): Promise<HttpResponse<ShareGroupItemInterface>> {
    return this.httpService.post(SharingPaths.addItemToShareGroup(groupUuid), {
      itemUuid,
    })
  }
}
