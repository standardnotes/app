import { ItemContent } from '../Content/ItemContent'
import { DecryptedPayloadInterface, DeletedPayloadInterface, isDecryptedPayload } from '../Payload'
import { ContextPayload } from './ContextPayload'

export interface OfflineSyncPushContextualPayload extends ContextPayload {
  content: ItemContent | undefined
  created_at_timestamp: number
  created_at: Date
  duplicate_of?: string
  updated_at_timestamp: number
  updated_at: Date
}

export function CreateOfflineSyncPushContextPayload(
  fromPayload: DecryptedPayloadInterface | DeletedPayloadInterface,
): OfflineSyncPushContextualPayload {
  const base: OfflineSyncPushContextualPayload = {
    content: undefined,
    content_type: fromPayload.content_type,
    created_at_timestamp: fromPayload.created_at_timestamp,
    created_at: fromPayload.created_at,
    deleted: false,
    duplicate_of: fromPayload.duplicate_of,
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
  }

  if (isDecryptedPayload(fromPayload)) {
    return {
      ...base,
      content: fromPayload.content,
    }
  } else {
    return {
      ...base,
      deleted: fromPayload.deleted,
    }
  }
}
