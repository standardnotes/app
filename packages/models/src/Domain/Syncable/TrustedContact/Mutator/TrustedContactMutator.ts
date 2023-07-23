import { DecryptedItemMutator } from '../../../Abstract/Item'
import { TrustedContactContent } from '../Content/TrustedContactContent'
import { TrustedContactInterface } from '../TrustedContactInterface'
import { ContactPublicKeySet } from '../PublicKeySet/ContactPublicKeySet'
import { PortablePublicKeySet } from '../Types/PortablePublicKeySet'
import { ContactPublicKeySetJsonInterface } from '../PublicKeySet/ContactPublicKeySetJsonInterface'

export class TrustedContactMutator extends DecryptedItemMutator<TrustedContactContent, TrustedContactInterface> {
  set name(newName: string) {
    this.mutableContent.name = newName
  }

  addPublicKey(keySet: PortablePublicKeySet): void {
    const newKey = new ContactPublicKeySet({
      encryption: keySet.encryption,
      signing: keySet.signing,
      timestamp: new Date(),
      previousKeySet: this.immutableItem.publicKeySet,
    })

    this.mutableContent.publicKeySet = newKey
  }

  replacePublicKeySet(publicKeySet: ContactPublicKeySetJsonInterface): void {
    this.mutableContent.publicKeySet = publicKeySet
  }
}
