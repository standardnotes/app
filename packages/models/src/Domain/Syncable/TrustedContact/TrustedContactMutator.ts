import { DecryptedItemMutator } from '../../Abstract/Item'
import { TrustedContactContent } from './TrustedContactContent'
import { TrustedContactInterface } from './TrustedContactInterface'
import { ContactPublicKeySet } from './PublicKeySet/ContactPublicKeySet'

export class TrustedContactMutator extends DecryptedItemMutator<TrustedContactContent, TrustedContactInterface> {
  set name(newName: string) {
    this.mutableContent.name = newName
  }

  addPublicKey(params: { encryption: string; signing: string }): void {
    const newKey = new ContactPublicKeySet(
      params.encryption,
      params.signing,
      new Date(),
      false,
      this.immutableItem.publicKeySet,
    )

    this.mutableContent.publicKeySet = newKey
  }

  replacePublicKeySet(publicKeySet: ContactPublicKeySet): void {
    this.mutableContent.publicKeySet = publicKeySet
  }
}
