import { VaultPermission } from './VaultPermission'

export interface VaultUserServerHash {
  uuid: string
  vault_uuid: string
  user_uuid: string
  inviter_uuid: string
  permissions: VaultPermission
  updated_at_timestamp: number
}
