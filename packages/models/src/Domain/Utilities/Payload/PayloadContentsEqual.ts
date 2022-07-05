import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { CreateDecryptedItemFromPayload } from '../Item/ItemGenerator'

/**
 * Compares the .content fields for equality, creating new SNItem objects
 * to properly handle .content intricacies.
 */
export function PayloadContentsEqual(
  payloadA: DecryptedPayloadInterface,
  payloadB: DecryptedPayloadInterface,
): boolean {
  const itemA = CreateDecryptedItemFromPayload(payloadA)
  const itemB = CreateDecryptedItemFromPayload(payloadB)
  return itemA.isItemContentEqualWith(itemB)
}
