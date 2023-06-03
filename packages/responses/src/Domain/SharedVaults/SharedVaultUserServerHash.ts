import { SharedVaultPermission } from './SharedVaultPermission'

export interface SharedVaultUserServerHash {
  uuid: string
  shared_vault_uuid: string
  user_uuid: string
  inviter_uuid: string
  permissions: SharedVaultPermission
  updated_at_timestamp: number
}
