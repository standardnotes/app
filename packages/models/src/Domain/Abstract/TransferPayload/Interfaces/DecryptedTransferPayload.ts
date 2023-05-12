import { ItemContent } from '../../Content/ItemContent'
import { TransferPayload } from './TransferPayload'

export interface DecryptedTransferPayload<C extends ItemContent = ItemContent> extends TransferPayload {
  content: C
}
