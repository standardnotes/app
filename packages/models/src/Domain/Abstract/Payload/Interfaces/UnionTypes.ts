import { ItemContent } from '../../Content/ItemContent'
import { DecryptedPayloadInterface } from './DecryptedPayload'
import { DeletedPayloadInterface } from './DeletedPayload'
import { EncryptedPayloadInterface } from './EncryptedPayload'

export type FullyFormedPayloadInterface<C extends ItemContent = ItemContent> =
  | DecryptedPayloadInterface<C>
  | EncryptedPayloadInterface
  | DeletedPayloadInterface

export type AnyNonDecryptedPayloadInterface = EncryptedPayloadInterface | DeletedPayloadInterface
