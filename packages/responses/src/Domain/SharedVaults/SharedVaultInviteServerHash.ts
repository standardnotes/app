import { SharedVaultInviteType } from './SharedVaultInviteType'
import { SharedVaultPermission } from './SharedVaultPermission'

export type SharedVaultInviteServerHash = {
  uuid: string
  shared_vault_uuid: string
  user_uuid: string
  inviter_uuid: string
  inviter_public_key: string
  encrypted_vault_key_content: string
  invite_type: SharedVaultInviteType
  permissions: SharedVaultPermission
  created_at_timestamp: number
  updated_at_timestamp: number
}
