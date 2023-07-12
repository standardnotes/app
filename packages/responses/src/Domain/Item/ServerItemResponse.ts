export interface ServerItemResponse {
  content_type: string
  content: string | undefined
  created_at_timestamp: number
  created_at: Date
  deleted: boolean
  duplicate_of?: string
  enc_item_key: string
  items_key_id?: string
  updated_at_timestamp: number
  updated_at: Date
  uuid: string
  user_uuid: string
  shared_vault_uuid: string | undefined
  key_system_identifier: string | undefined
  last_edited_by_uuid?: string
}
