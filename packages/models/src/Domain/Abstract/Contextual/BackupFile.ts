import { Uuid } from '@standardnotes/common'
import { ContextPayload } from './ContextPayload'
import { ItemContent } from '../Content/ItemContent'
import { DecryptedTransferPayload, EncryptedTransferPayload } from '../TransferPayload'

export interface BackupFileEncryptedContextualPayload extends ContextPayload {
  auth_hash?: string
  content: string
  created_at_timestamp: number
  created_at: Date
  duplicate_of?: Uuid
  enc_item_key: string
  items_key_id: string | undefined
  updated_at: Date
  updated_at_timestamp: number
}

export interface BackupFileDecryptedContextualPayload<C extends ItemContent = ItemContent> extends ContextPayload {
  content: C
  created_at_timestamp: number
  created_at: Date
  duplicate_of?: Uuid
  updated_at: Date
  updated_at_timestamp: number
}

export function CreateEncryptedBackupFileContextPayload(
  fromPayload: EncryptedTransferPayload,
): BackupFileEncryptedContextualPayload {
  return {
    auth_hash: fromPayload.auth_hash,
    content_type: fromPayload.content_type,
    content: fromPayload.content,
    created_at_timestamp: fromPayload.created_at_timestamp,
    created_at: fromPayload.created_at,
    deleted: false,
    duplicate_of: fromPayload.duplicate_of,
    enc_item_key: fromPayload.enc_item_key,
    items_key_id: fromPayload.items_key_id,
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
  }
}

export function CreateDecryptedBackupFileContextPayload(
  fromPayload: DecryptedTransferPayload,
): BackupFileDecryptedContextualPayload {
  return {
    content_type: fromPayload.content_type,
    content: fromPayload.content,
    created_at_timestamp: fromPayload.created_at_timestamp,
    created_at: fromPayload.created_at,
    deleted: false,
    duplicate_of: fromPayload.duplicate_of,
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
  }
}
