import { ContextPayload } from './ContextPayload'
import { ItemContent } from '../Content/ItemContent'
import { DecryptedPayloadInterface, DeletedPayloadInterface, EncryptedPayloadInterface } from '../Payload'
import { useBoolean } from '@standardnotes/utils'
import { EncryptedTransferPayload, isEncryptedTransferPayload } from '../TransferPayload'
import { PersistentSignatureData } from '../../Runtime/Encryption/PersistentSignatureData'

export function isEncryptedLocalStoragePayload(
  p: LocalStorageEncryptedContextualPayload | LocalStorageDecryptedContextualPayload,
): p is LocalStorageEncryptedContextualPayload {
  return isEncryptedTransferPayload(p as EncryptedTransferPayload)
}

export interface LocalStorageEncryptedContextualPayload extends ContextPayload {
  auth_hash?: string
  auth_params?: unknown
  content: string
  deleted: false
  created_at_timestamp: number
  created_at: Date
  dirty: boolean
  duplicate_of: string | undefined
  enc_item_key: string
  errorDecrypting: boolean
  items_key_id: string | undefined
  updated_at_timestamp: number
  updated_at: Date
  waitingForKey: boolean
  signatureData?: PersistentSignatureData
}

export interface LocalStorageDecryptedContextualPayload<C extends ItemContent = ItemContent> extends ContextPayload {
  content: C
  created_at_timestamp: number
  created_at: Date
  deleted: false
  dirty: boolean
  duplicate_of?: string
  updated_at_timestamp: number
  updated_at: Date
  signatureData?: PersistentSignatureData
}

export interface LocalStorageDeletedContextualPayload extends ContextPayload {
  content: undefined
  created_at_timestamp: number
  created_at: Date
  deleted: true
  dirty: true
  duplicate_of?: string
  updated_at_timestamp: number
  updated_at: Date
  signatureData?: PersistentSignatureData
}

export function CreateEncryptedLocalStorageContextPayload(
  fromPayload: EncryptedPayloadInterface,
): LocalStorageEncryptedContextualPayload {
  return {
    auth_hash: fromPayload.auth_hash,
    content_type: fromPayload.content_type,
    content: fromPayload.content,
    created_at_timestamp: fromPayload.created_at_timestamp,
    created_at: fromPayload.created_at,
    deleted: false,
    dirty: fromPayload.dirty != undefined ? fromPayload.dirty : false,
    duplicate_of: fromPayload.duplicate_of,
    enc_item_key: fromPayload.enc_item_key,
    errorDecrypting: fromPayload.errorDecrypting,
    items_key_id: fromPayload.items_key_id,
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
    waitingForKey: fromPayload.waitingForKey,
    user_uuid: fromPayload.user_uuid,
    key_system_identifier: fromPayload.key_system_identifier,
    shared_vault_uuid: fromPayload.shared_vault_uuid,
    last_edited_by_uuid: fromPayload.last_edited_by_uuid,
    signatureData: fromPayload.signatureData,
  }
}

export function CreateDecryptedLocalStorageContextPayload(
  fromPayload: DecryptedPayloadInterface,
): LocalStorageDecryptedContextualPayload {
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
    dirty: useBoolean(fromPayload.dirty, false),
    user_uuid: fromPayload.user_uuid,
    key_system_identifier: fromPayload.key_system_identifier,
    shared_vault_uuid: fromPayload.shared_vault_uuid,
    last_edited_by_uuid: fromPayload.last_edited_by_uuid,
    signatureData: fromPayload.signatureData,
  }
}

export function CreateDeletedLocalStorageContextPayload(
  fromPayload: DeletedPayloadInterface,
): LocalStorageDeletedContextualPayload {
  return {
    content_type: fromPayload.content_type,
    content: undefined,
    created_at_timestamp: fromPayload.created_at_timestamp,
    created_at: fromPayload.created_at,
    deleted: true,
    dirty: true,
    duplicate_of: fromPayload.duplicate_of,
    updated_at_timestamp: fromPayload.updated_at_timestamp,
    updated_at: fromPayload.updated_at,
    uuid: fromPayload.uuid,
    user_uuid: fromPayload.user_uuid,
    key_system_identifier: fromPayload.key_system_identifier,
    shared_vault_uuid: fromPayload.shared_vault_uuid,
    last_edited_by_uuid: fromPayload.last_edited_by_uuid,
    signatureData: fromPayload.signatureData,
  }
}
