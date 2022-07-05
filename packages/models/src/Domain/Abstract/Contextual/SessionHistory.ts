import { ItemContent } from '../Content/ItemContent'
import { ContextPayload } from './ContextPayload'

export interface SessionHistoryContextualPayload<C extends ItemContent = ItemContent> extends ContextPayload {
  content: C
  updated_at: Date
}
