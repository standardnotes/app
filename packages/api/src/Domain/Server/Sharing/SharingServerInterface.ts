import { HttpResponse } from '@standardnotes/responses'
import { ShareGroupInterface } from './ShareGroup'
import { ShareGroupItemInterface } from './ShareGroupItem'
import { ShareGroupUserInterface } from './ShareGroupUser'
import { ShareGroupPermission } from './ShareGroupPermission'

export interface SharingServerInterface {
  createShareGroup(): Promise<HttpResponse<ShareGroupInterface>>

  addUserToShareGroup(
    groupUuid: string,
    userUuid: string,
    encryptedGroupKey: string,
    permissions: ShareGroupPermission,
  ): Promise<HttpResponse<ShareGroupUserInterface>>

  addItemToShareGroup(itemUuid: string, groupUuid: string): Promise<HttpResponse<ShareGroupItemInterface>>
}
