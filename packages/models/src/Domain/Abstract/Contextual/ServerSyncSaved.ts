import { useBoolean } from '@standardnotes/utils'
import { FilteredServerItem } from './FilteredServerItem'

/**
 * The saved sync item payload represents the payload we want to map
 * when mapping saved_items from the server. We only want to map the
 * updated_at value the server returns for the item, and basically
 * nothing else.
 */
export interface ServerSyncSavedContextualPayload {
  content_type: string
  created_at_timestamp: number
  created_at: Date
  deleted: boolean
  updated_at_timestamp: number
  updated_at: Date
  uuid: string
  key_system_identifier: string | undefined
  shared_vault_uuid: string | undefined
  user_uuid: string
  duplicate_of?: string
  last_edited_by_uuid?: string
}

export function CreateServerSyncSavedPayload(from: FilteredServerItem): ServerSyncSavedContextualPayload {
  return {
    content_type: from.content_type,
    created_at_timestamp: from.created_at_timestamp,
    created_at: from.created_at,
    deleted: useBoolean(from.deleted, false),
    updated_at_timestamp: from.updated_at_timestamp,
    updated_at: from.updated_at,
    uuid: from.uuid,
    key_system_identifier: from.key_system_identifier,
    shared_vault_uuid: from.shared_vault_uuid,
    user_uuid: from.user_uuid,
    duplicate_of: from.duplicate_of,
    last_edited_by_uuid: from.last_edited_by_uuid,
  }
}
