import { ContentType } from '@standardnotes/common'
import { ItemContent } from '../Content/ItemContent'

export interface ContextPayload<C extends ItemContent = ItemContent> {
  uuid: string
  content_type: ContentType
  content: C | string | undefined
  deleted: boolean

  user_uuid?: string
  vault_system_identifier?: string

  group_uuid?: string
  last_edited_by_uuid?: string
}
