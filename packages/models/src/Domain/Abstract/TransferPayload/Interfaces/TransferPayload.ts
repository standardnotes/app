import { ContentType } from '@standardnotes/common'
import { ItemContent } from '../../Content/ItemContent'
import { ClientRawSigningData } from '../../../Runtime/Encryption/ClientRawSigningData'

export interface TransferPayload<C extends ItemContent = ItemContent> {
  uuid: string
  content_type: ContentType
  content: C | string | undefined
  deleted?: boolean

  updated_at: Date
  created_at: Date
  created_at_timestamp: number
  updated_at_timestamp: number

  dirtyIndex?: number
  globalDirtyIndexAtLastSync?: number
  dirty?: boolean
  encryptedRawSigningData?: string
  decryptedClientRawSigningData?: ClientRawSigningData

  lastSyncBegan?: Date
  lastSyncEnd?: Date

  duplicate_of?: string
  user_uuid?: string

  key_system_identifier?: string | undefined
  shared_vault_uuid?: string | undefined

  last_edited_by_uuid?: string

  signatureVerified?: boolean
}
