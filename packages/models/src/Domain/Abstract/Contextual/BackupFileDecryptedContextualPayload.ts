import { ItemContent } from '../Content/ItemContent'
import { ContextPayload } from './ContextPayload'

export interface BackupFileDecryptedContextualPayload<C extends ItemContent = ItemContent> extends ContextPayload {
  content: C
  created_at_timestamp: number
  created_at: Date
  duplicate_of?: string
  updated_at: Date
  updated_at_timestamp: number
}
