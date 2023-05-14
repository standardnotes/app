import { ShareGroupPermission } from './ShareGroupPermission'

export interface ShareGroupUserInterface {
  groupUuid: string
  userUuid: string
  encryptedGroupKey: string
  permissions: ShareGroupPermission
}
