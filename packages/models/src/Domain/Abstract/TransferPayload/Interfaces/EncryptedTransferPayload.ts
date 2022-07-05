import { TransferPayload } from './TransferPayload'

export interface EncryptedTransferPayload extends TransferPayload {
  content: string
  enc_item_key: string
  items_key_id: string | undefined
  errorDecrypting: boolean
  waitingForKey: boolean
  /** @deprecated */
  auth_hash?: string
}
