import { CreatePayload } from './CreatePayload'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedTransferPayload } from '../../Abstract/TransferPayload'

export function CopyPayloadWithContentOverride<C extends ItemContent = ItemContent>(
  payload: DecryptedPayloadInterface<C>,
  contentOverride: Partial<C>,
): DecryptedPayloadInterface<C> {
  const params: DecryptedTransferPayload<C> = {
    ...payload.ejected(),
    content: {
      ...payload.content,
      ...contentOverride,
    },
  }
  const result = CreatePayload(params, payload.source)
  return result
}
