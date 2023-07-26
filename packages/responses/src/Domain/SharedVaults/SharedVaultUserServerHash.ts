import { SharedVaultPermission } from './SharedVaultPermission'

export interface SharedVaultUserServerHash {
  uuid: string
  shared_vault_uuid: string
  user_uuid: string
  permission: SharedVaultPermission
  updated_at_timestamp: number
}
