import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { TrustedContactContent } from './TrustedContactContent'

export interface TrustedContactInterface extends DecryptedItemInterface<TrustedContactContent> {
  contactItemUuid: string
  contactUserUuid: string
  contactPublicKey: string
}
