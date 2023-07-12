import { ItemContent } from '../Content/ItemContent'

export interface ContextPayload<C extends ItemContent = ItemContent> {
  uuid: string
  content_type: string
  content: C | string | undefined
  deleted: boolean

  user_uuid?: string
  key_system_identifier?: string | undefined
  shared_vault_uuid?: string | undefined
  last_edited_by_uuid?: string
}
