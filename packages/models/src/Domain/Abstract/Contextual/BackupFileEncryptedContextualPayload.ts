import { ContextPayload } from './ContextPayload'

export interface BackupFileEncryptedContextualPayload extends ContextPayload {
  auth_hash?: string
  content: string
  created_at_timestamp: number
  created_at: Date
  duplicate_of?: string
  enc_item_key: string
  items_key_id: string | undefined
  updated_at: Date
  updated_at_timestamp: number
}
