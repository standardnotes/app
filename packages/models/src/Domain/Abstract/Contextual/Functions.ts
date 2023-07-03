import { DecryptedTransferPayload, EncryptedTransferPayload } from '../TransferPayload'

import { BackupFileDecryptedContextualPayload } from './BackupFileDecryptedContextualPayload'
import { BackupFileEncryptedContextualPayload } from './BackupFileEncryptedContextualPayload'

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
    key_system_identifier: fromPayload.key_system_identifier,
    shared_vault_uuid: fromPayload.shared_vault_uuid,
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
    key_system_identifier: fromPayload.key_system_identifier,
    shared_vault_uuid: fromPayload.shared_vault_uuid,
  }
}
