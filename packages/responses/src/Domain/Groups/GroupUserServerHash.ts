import { GroupPermission } from './GroupPermission'

export interface GroupUserServerHash {
  uuid: string
  group_uuid: string
  user_uuid: string
  inviter_uuid: string
  permissions: GroupPermission
  updated_at_timestamp: number
}
