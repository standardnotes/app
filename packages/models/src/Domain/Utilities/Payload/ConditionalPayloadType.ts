import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { DeletedPayloadInterface } from '../../Abstract/Payload/Interfaces/DeletedPayload'
import { EncryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/EncryptedPayload'
import {
  DecryptedTransferPayload,
  DeletedTransferPayload,
  EncryptedTransferPayload,
} from '../../Abstract/TransferPayload'

export type ConditionalPayloadType<T> = T extends DecryptedTransferPayload<infer C>
  ? DecryptedPayloadInterface<C>
  : T extends EncryptedTransferPayload
  ? EncryptedPayloadInterface
  : DeletedPayloadInterface

export type ConditionalTransferPayloadType<P> = P extends DecryptedPayloadInterface<infer C>
  ? DecryptedTransferPayload<C>
  : P extends EncryptedPayloadInterface
  ? EncryptedTransferPayload
  : DeletedTransferPayload
