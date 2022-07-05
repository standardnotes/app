import { ProtocolVersion } from '@standardnotes/common'
import { EncryptedPayloadInterface } from '../../Payload/Interfaces/EncryptedPayload'
import { ItemInterface } from './ItemInterface'

export interface EncryptedItemInterface extends ItemInterface<EncryptedPayloadInterface> {
  content: string
  version: ProtocolVersion
  errorDecrypting: boolean
  waitingForKey?: boolean
  auth_hash?: string
}
