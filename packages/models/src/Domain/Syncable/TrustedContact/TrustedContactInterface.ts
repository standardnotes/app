import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { TrustedContactContent } from './TrustedContactContent'

export interface TrustedContactInterface extends DecryptedItemInterface<TrustedContactContent> {
  serverUuid: string
  contactUuid: string
  publicKey: string
  name: string
}
