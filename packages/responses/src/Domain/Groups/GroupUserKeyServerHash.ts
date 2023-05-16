export interface GroupUserKeyServerHash {
  uuid: string
  group_uuid: string
  user_uuid: string
  encrypted_group_key: string
  sender_public_key: string
  permissions: string
  updated_at_timestamp: number
}
