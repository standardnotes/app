import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { ContactContent } from './ContactContent'

export interface ContactInterface extends DecryptedItemInterface<ContactContent> {
  readonly name: string
  readonly userUuid: string
  readonly publicKey: string
}
