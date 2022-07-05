import { EncryptedTransferPayload } from './../../TransferPayload/Interfaces/EncryptedTransferPayload'
import { EncryptedItemInterface } from '../Interfaces/EncryptedItem'
import { EncryptedPayloadInterface } from '../../Payload/Interfaces/EncryptedPayload'
import { GenericItem } from './GenericItem'

export class EncryptedItem extends GenericItem<EncryptedPayloadInterface> implements EncryptedItemInterface {
  constructor(payload: EncryptedPayloadInterface) {
    super(payload)
  }

  get version() {
    return this.payload.version
  }

  public override payloadRepresentation(override?: Partial<EncryptedTransferPayload>): EncryptedPayloadInterface {
    return this.payload.copy(override)
  }

  get errorDecrypting() {
    return this.payload.errorDecrypting
  }

  get waitingForKey() {
    return this.payload.waitingForKey
  }

  get content() {
    return this.payload.content
  }

  get auth_hash() {
    return this.payload.auth_hash
  }
}
