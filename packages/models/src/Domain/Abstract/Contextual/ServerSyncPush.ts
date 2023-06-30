import { DeletedPayloadInterface, EncryptedPayloadInterface } from '../Payload'
import { ContextPayload } from './ContextPayload'

export interface ServerSyncPushContextualPayload extends ContextPayload {
  auth_hash?: string
  content: string | undefined
  created_at_timestamp: number
  created_at: Date
  duplicate_of?: string
  enc_item_key?: string
  items_key_id?: string
  updated_at_timestamp: number
  updated_at: Date
}

export function CreateEncryptedServerSyncPushPayload(
  fromPayload: EncryptedPayloadInterface,
): ServerSyncPushContextualPayload {
  return {
    content_type: fromPayload.content_type,
    created_at_timestamp: fromPayload.created_at_timestamp,
    created_at: fromPayload.created_at,
    deleted: false,
    duplicate_of: fromPayload.duplicate_of,
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
    content: fromPayload.content,
    enc_item_key: fromPayload.enc_item_key,
    items_key_id: fromPayload.items_key_id,
    auth_hash: fromPayload.auth_hash,
    key_system_identifier: fromPayload.key_system_identifier,
    shared_vault_uuid: fromPayload.shared_vault_uuid,
  }
}

export function CreateDeletedServerSyncPushPayload(
  fromPayload: DeletedPayloadInterface,
): ServerSyncPushContextualPayload {
  return {
    content_type: fromPayload.content_type,
    created_at_timestamp: fromPayload.created_at_timestamp,
    created_at: fromPayload.created_at,
    deleted: true,
    duplicate_of: fromPayload.duplicate_of,
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
    content: undefined,
    key_system_identifier: fromPayload.key_system_identifier,
    shared_vault_uuid: fromPayload.shared_vault_uuid,
  }
}
