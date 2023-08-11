import { ProtocolVersion } from '../../../Local/Protocol/ProtocolVersion'
import { EncryptedTransferPayload } from '../../TransferPayload/Interfaces/EncryptedTransferPayload'
import { PayloadInterface } from './PayloadInterface'

export interface EncryptedPayloadInterface extends PayloadInterface<EncryptedTransferPayload> {
  readonly content: string
  readonly deleted: false
  readonly enc_item_key: string
  readonly items_key_id: string | undefined
  readonly errorDecrypting: boolean
  readonly waitingForKey: boolean
  readonly version: ProtocolVersion

  /** @deprecated */
  readonly auth_hash?: string

  ejected(): EncryptedTransferPayload
}
