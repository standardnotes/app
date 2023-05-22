import { DecryptedItemMutator } from '../../Abstract/Item'
import { TrustedContactContent } from './TrustedContactContent'

export class TrustedContactMutator extends DecryptedItemMutator<TrustedContactContent> {
  set name(newName: string) {
    this.mutableContent.name = newName
  }

  set publicKey(newPublicKey: string) {
    this.mutableContent.publicKey = newPublicKey
  }
}
