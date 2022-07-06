import { ContentType, Uuid } from '@standardnotes/common'

export interface ServerItemResponse {
  content_type: ContentType
  content: string | undefined
  created_at_timestamp: number
  created_at: Date
  deleted: boolean
  duplicate_of?: Uuid
  enc_item_key: string
  items_key_id?: string
  updated_at_timestamp: number
  updated_at: Date
  uuid: string
}
