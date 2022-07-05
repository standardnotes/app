import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { DeletedPayloadInterface } from '../../Abstract/Payload/Interfaces/DeletedPayload'
import { EncryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/EncryptedPayload'
import { isDecryptedPayload, isDeletedPayload, isEncryptedPayload } from '../../Abstract/Payload/Interfaces/TypeCheck'
import { FullyFormedPayloadInterface } from '../../Abstract/Payload/Interfaces/UnionTypes'

export interface PayloadSplit<C extends ItemContent = ItemContent> {
  encrypted: EncryptedPayloadInterface[]
  decrypted: DecryptedPayloadInterface<C>[]
  deleted: DeletedPayloadInterface[]
}

export interface PayloadSplitWithDiscardables<C extends ItemContent = ItemContent> {
  encrypted: EncryptedPayloadInterface[]
  decrypted: DecryptedPayloadInterface<C>[]
  deleted: DeletedPayloadInterface[]
  discardable: DeletedPayloadInterface[]
}

export interface NonDecryptedPayloadSplit {
  encrypted: EncryptedPayloadInterface[]
  deleted: DeletedPayloadInterface[]
}

export function CreatePayloadSplit<C extends ItemContent = ItemContent>(
  payloads: FullyFormedPayloadInterface<C>[],
): PayloadSplit<C> {
  const split: PayloadSplit<C> = {
    encrypted: [],
    decrypted: [],
    deleted: [],
  }

  for (const payload of payloads) {
    if (isDecryptedPayload(payload)) {
      split.decrypted.push(payload)
    } else if (isEncryptedPayload(payload)) {
      split.encrypted.push(payload)
    } else if (isDeletedPayload(payload)) {
      split.deleted.push(payload)
    } else {
      throw Error('Unhandled case in CreatePayloadSplit')
    }
  }

  return split
}

export function CreatePayloadSplitWithDiscardables<C extends ItemContent = ItemContent>(
  payloads: FullyFormedPayloadInterface<C>[],
): PayloadSplitWithDiscardables<C> {
  const split: PayloadSplitWithDiscardables<C> = {
    encrypted: [],
    decrypted: [],
    deleted: [],
    discardable: [],
  }

  for (const payload of payloads) {
    if (isDecryptedPayload(payload)) {
      split.decrypted.push(payload)
    } else if (isEncryptedPayload(payload)) {
      split.encrypted.push(payload)
    } else if (isDeletedPayload(payload)) {
      if (payload.discardable) {
        split.discardable.push(payload)
      } else {
        split.deleted.push(payload)
      }
    } else {
      throw Error('Unhandled case in CreatePayloadSplitWithDiscardables')
    }
  }

  return split
}

export function CreateNonDecryptedPayloadSplit(
  payloads: (EncryptedPayloadInterface | DeletedPayloadInterface)[],
): NonDecryptedPayloadSplit {
  const split: NonDecryptedPayloadSplit = {
    encrypted: [],
    deleted: [],
  }

  for (const payload of payloads) {
    if (isEncryptedPayload(payload)) {
      split.encrypted.push(payload)
    } else if (isDeletedPayload(payload)) {
      split.deleted.push(payload)
    } else {
      throw Error('Unhandled case in CreateNonDecryptedPayloadSplit')
    }
  }

  return split
}
