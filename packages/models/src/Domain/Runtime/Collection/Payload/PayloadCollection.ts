import { FullyFormedPayloadInterface } from './../../../Abstract/Payload/Interfaces/UnionTypes'
import { EncryptedPayloadInterface } from '../../../Abstract/Payload/Interfaces/EncryptedPayload'
import { CollectionInterface } from '../CollectionInterface'
import { DecryptedPayloadInterface } from '../../../Abstract/Payload/Interfaces/DecryptedPayload'
import { IntegrityPayload } from '@standardnotes/responses'
import { Collection } from '../Collection'
import { DeletedPayloadInterface } from '../../../Abstract/Payload'

export class PayloadCollection<P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface>
  extends Collection<P, DecryptedPayloadInterface, EncryptedPayloadInterface, DeletedPayloadInterface>
  implements CollectionInterface
{
  public integrityPayloads(): IntegrityPayload[] {
    const nondeletedElements = this.nondeletedElements()

    return nondeletedElements.map((item) => ({
      uuid: item.uuid,
      updated_at_timestamp: item.serverUpdatedAtTimestamp as number,
    }))
  }
}
