import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { TrustedContactContent } from './TrustedContactContent'

export interface TrustedContactInterface extends DecryptedItemInterface<TrustedContactContent> {
  contactItemUuid: string
  userUuid: string
  publicKey: string
  name: string
}
