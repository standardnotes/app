import { GroupPermission } from './GroupPermission'

export interface GroupUserInterface {
  groupUuid: string
  userUuid: string
  encryptedGroupKey: string
  permissions: GroupPermission
}
