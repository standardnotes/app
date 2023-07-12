import { DecryptedPayloadInterface, DeletedPayloadInterface, isDeletedPayload } from '../Payload'

/**
 * The saved sync item payload represents the payload we want to map
 * when mapping saved_items from the server or local sync mechanism. We only want to map the
 * updated_at value the server returns for the item, and basically
 * nothing else.
 */
export interface OfflineSyncSavedContextualPayload {
  content_type: string
  created_at_timestamp: number
  deleted: boolean
  updated_at_timestamp?: number
  updated_at: Date
  uuid: string
}

export function CreateOfflineSyncSavedPayload(
  fromPayload: DecryptedPayloadInterface | DeletedPayloadInterface,
): OfflineSyncSavedContextualPayload {
  return {
    content_type: fromPayload.content_type,
    created_at_timestamp: fromPayload.created_at_timestamp,
    deleted: isDeletedPayload(fromPayload),
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
  }
}
