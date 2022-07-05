import { ItemContent } from '../Content/ItemContent'
import { DecryptedTransferPayload } from '../TransferPayload'
import { ContextPayload } from './ContextPayload'

/**
 * Represents a payload with permissible fields for when a
 * payload is retrieved from a component for saving
 */
export interface ComponentRetrievedContextualPayload<C extends ItemContent = ItemContent> extends ContextPayload {
  content: C
  created_at?: Date
}

export function CreateComponentRetrievedContextPayload(
  fromPayload: DecryptedTransferPayload,
): ComponentRetrievedContextualPayload {
  return {
    content_type: fromPayload.content_type,
    content: fromPayload.content,
    created_at: fromPayload.created_at,
    deleted: false,
    uuid: fromPayload.uuid,
  }
}
