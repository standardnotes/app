import { EncryptedPayload } from '../../Abstract/Payload/Implementations/EncryptedPayload'
import { DeletedPayload } from '../../Abstract/Payload/Implementations/DeletedPayload'
import { DecryptedPayload } from '../../Abstract/Payload/Implementations/DecryptedPayload'
import {
  FullyFormedTransferPayload,
  isDecryptedTransferPayload,
  isDeletedTransferPayload,
  isEncryptedTransferPayload,
} from '../../Abstract/TransferPayload'
import { PayloadSource } from '../../Abstract/Payload/Types/PayloadSource'
import { ConditionalPayloadType } from './ConditionalPayloadType'

export function CreatePayload<T extends FullyFormedTransferPayload>(
  from: T,
  source: PayloadSource,
): ConditionalPayloadType<T> {
  if (isDecryptedTransferPayload(from)) {
    return new DecryptedPayload(from, source) as unknown as ConditionalPayloadType<T>
  } else if (isEncryptedTransferPayload(from)) {
    return new EncryptedPayload(from, source) as unknown as ConditionalPayloadType<T>
  } else if (isDeletedTransferPayload(from)) {
    return new DeletedPayload(from, source) as unknown as ConditionalPayloadType<T>
  } else {
    throw Error('Unhandled case in CreatePayload')
  }
}
