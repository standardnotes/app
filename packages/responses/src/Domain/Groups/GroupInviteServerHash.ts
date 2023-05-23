import { GroupInviteType } from './GroupInviteType'
import { GroupPermission } from './GroupPermission'

export type GroupInviteServerHash = {
  uuid: string
  group_uuid: string
  user_uuid: string
  inviter_uuid: string
  inviter_public_key: string
  encrypted_group_data: string
  invite_type: GroupInviteType
  permissions: GroupPermission
  created_at_timestamp: number
  updated_at_timestamp: number
}
