import { AsymmetricMessageServerHash } from '../AsymmetricMessage/AsymmetricMessageServerHash'
import { SharedVaultPermission } from './SharedVaultPermission'

export interface SharedVaultInviteServerHash extends AsymmetricMessageServerHash {
  uuid: string
  shared_vault_uuid: string
  user_uuid: string
  sender_uuid: string
  sender_public_key: string
  encrypted_message: string
  permissions: SharedVaultPermission
  created_at_timestamp: number
  updated_at_timestamp: number
}
