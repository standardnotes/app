import { ContentType } from '@standardnotes/common'
import { ItemContent } from '../../Content/ItemContent'

export interface TransferPayload<C extends ItemContent = ItemContent> {
  uuid: string
  content_type: ContentType
  content: C | string | undefined
  deleted?: boolean

  updated_at: Date
  created_at: Date
  created_at_timestamp: number
  updated_at_timestamp: number

  dirtyIndex?: number
  globalDirtyIndexAtLastSync?: number
  dirty?: boolean

  lastSyncBegan?: Date
  lastSyncEnd?: Date

  duplicate_of?: string
  user_uuid?: string
  vault_system_identifier?: string

  group_uuid?: string
  last_edited_by_uuid?: string
}
