import { DecryptedTransferPayload } from './../../TransferPayload/Interfaces/DecryptedTransferPayload'
import { ItemContent } from '../../Content/ItemContent'
import { ContentReference } from '../../Reference/ContentReference'
import { PayloadInterface } from './PayloadInterface'

export interface DecryptedPayloadInterface<C extends ItemContent = ItemContent>
  extends PayloadInterface<DecryptedTransferPayload> {
  readonly content: C
  deleted: false

  ejected(): DecryptedTransferPayload<C>
  get references(): ContentReference[]
  getReference(uuid: string): ContentReference
}
